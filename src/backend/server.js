const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const API_PORT = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildGoogleAuth() {
  const clientEmail = requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = requireEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ]
  });
}

async function getLeaderboardFromSheet() {
  const sheetId = requireEnv('LEADERBOARD_SHEET_ID');
  const range = process.env.LEADERBOARD_SHEET_RANGE || 'Sheet1!A2:C';
  const auth = buildGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  const rows = response.data.values || [];
  const entries = [];

  for (const row of rows) {
    const [rankRaw = '', nameRaw = '', scoreRaw = ''] = row;
    const rank = String(rankRaw).trim();
    const name = String(nameRaw).trim();
    const score = String(scoreRaw).trim();

    if (!rank && !name && !score) {
      continue;
    }

    const firstCell = rank.toLowerCase();
    if (firstCell === 'rank' && !name && !score) {
      continue;
    }
    if (firstCell === 'rank' && name.toLowerCase() === 'name') {
      continue;
    }

    entries.push({ rank, name, score });
  }

  return entries;
}

function buildEmailTransport() {
  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS')
    }
  });
}

function formatSubmittedAt(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 || 12;
  return `${day}/${month}/${year} ${hours12}:${minutes}${ampm}`;
}

async function getLatestPdfFromFolder(folderId) {
  const auth = buildGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });
  try {
    await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType',
      supportsAllDrives: true
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      const accessError = new Error(
        'Configured Drive folder is not accessible. Ensure DRIVE_FOLDER_ID is correct and the folder is shared with the service account.'
      );
      accessError.statusCode = 403;
      throw accessError;
    }
    throw error;
  }

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
    fields: 'files(id, name, createdTime, webViewLink)',
    orderBy: 'createdTime desc',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });

  const [latestFile] = response.data.files || [];
  if (!latestFile) {
    return null;
  }

  return {
    id: latestFile.id,
    name: latestFile.name,
    createdTime: latestFile.createdTime,
    webViewUrl: `https://drive.google.com/file/d/${latestFile.id}/preview`,
    embedUrl: '/api/latest-pdf/content',
    downloadUrl: `https://drive.google.com/uc?export=download&id=${latestFile.id}`,
    driveLink: latestFile.webViewLink || null
  };
}

app.get('/api/latest-pdf', async (req, res) => {
  try {
    const folderId = requireEnv('DRIVE_FOLDER_ID');
    const latestPdf = await getLatestPdfFromFolder(folderId);

    if (!latestPdf) {
      return res.status(404).json({ error: 'No PDF found in configured Drive folder.' });
    }

    return res.json(latestPdf);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'Failed to fetch latest PDF from Google Drive.',
      details: error.message
    });
  }
});

app.get('/api/latest-pdf/content', async (req, res) => {
  try {
    const folderId = requireEnv('DRIVE_FOLDER_ID');
    const latestPdf = await getLatestPdfFromFolder(folderId);
    if (!latestPdf) {
      return res.status(404).json({ error: 'No PDF found in configured Drive folder.' });
    }

    const auth = buildGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const fileResponse = await drive.files.get(
      {
        fileId: latestPdf.id,
        alt: 'media',
        supportsAllDrives: true
      },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${latestPdf.name || 'question.pdf'}"`);
    fileResponse.data.pipe(res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: 'Failed to stream latest PDF from Google Drive.',
      details: error.message
    });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const { name = '', email = '', solution = '', latexMode = false } = req.body || {};
    if (!solution.trim()) {
      return res.status(400).json({ error: 'Solution is required.' });
    }

    const mailTo = process.env.SUBMISSION_TO_EMAIL || 'acascompetitions.unswmathsoc@gmail.com';
    const fromEmail = process.env.SUBMISSION_FROM_EMAIL || requireEnv('SMTP_USER');
    const transporter = buildEmailTransport();
    const submittedAt = formatSubmittedAt();

    await transporter.sendMail({
      from: fromEmail,
      to: mailTo,
      cc: email.trim() ? email.trim() : undefined,
      subject: `Puzzle Submission - ${name.trim() || 'Anonymous'}`,
      text: [
        `Submitted At: ${submittedAt}`,
        `Name: ${name.trim() || 'Not provided'}`,
        `Email: ${email.trim() || 'Not provided'}`,
        `LaTeX mode: ${latexMode ? 'yes' : 'no'}`,
        '',
        'Solution:',
        solution.trim()
      ].join('\n')
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to send submission email.',
      details: error.message
    });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const entries = await getLeaderboardFromSheet();
    return res.json({ entries });
  } catch (error) {
    const isForbidden = error.code === 403 || error.response?.status === 403;
    const statusCode = isForbidden ? 403 : (error.statusCode || 500);
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'your service account email';
    const details = isForbidden
      ? `Share the LEADERBOARD Google Sheet with ${serviceEmail} as Viewer (not only the Drive folder).`
      : error.message;
    return res.status(statusCode).json({
      error: 'Failed to fetch leaderboard from Google Sheets.',
      details
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(API_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${API_PORT}`);
});
