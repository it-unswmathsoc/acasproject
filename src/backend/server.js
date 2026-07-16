const path = require('path');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const fs = require('fs');
const projectEnv = path.resolve(__dirname, '..', '..', '.env');
const parentEnv = path.resolve(__dirname, '..', '..', '..', '.env');
require('dotenv').config({ path: fs.existsSync(projectEnv) ? projectEnv : parentEnv });

const app = express();
const API_PORT = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

function requireEnv(name) {
  const value = process.env[name]?.trim();
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

function headerLabelToKey(label, usedKeys) {
  const base =
    String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'column';

  let key = base;
  let n = 1;
  while (usedKeys.has(key)) {
    n += 1;
    key = `${base}_${n}`;
  }
  usedKeys.add(key);
  return key;
}

/** First row = column headers; following rows = data. Extra sheet columns are picked up automatically. */
function parseLeaderboardRows(rows) {
  if (!rows.length) {
    return { columns: [], entries: [] };
  }

  const headerCells = rows[0].map((cell) => String(cell ?? '').trim());
  const usedKeys = new Set();
  const columns = headerCells.map((label, index) => ({
    key: headerLabelToKey(label || `column_${index + 1}`, usedKeys),
    label: label || `Column ${index + 1}`
  }));

  const entries = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const values = columns.map((_, i) => String(row[i] ?? '').trim());
    if (values.every((v) => !v)) {
      continue;
    }

    const entry = {};
    columns.forEach((col, i) => {
      entry[col.key] = values[i];
    });
    entries.push(entry);
  }

  return { columns, entries };
}

async function getLeaderboardFromSheet() {
  const sheetId = requireEnv('LEADERBOARD_SHEET_ID');
  const range = process.env.LEADERBOARD_SHEET_RANGE || 'Sheet1!A1:ZZ';
  const auth = buildGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  return parseLeaderboardRows(response.data.values || []);
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
    console.error('Failed to fetch latest PDF from Google Drive:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'Failed to fetch latest PDF from Google Drive.'
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
    console.error('Failed to stream latest PDF from Google Drive:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: 'Failed to stream latest PDF from Google Drive.'
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
    console.error('Failed to send submission email:', error);
    return res.status(500).json({
      error: 'We could not send your submission right now. Please try again later.'
    });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { columns, entries } = await getLeaderboardFromSheet();
    return res.json({ columns, entries });
  } catch (error) {
    console.error('Failed to fetch leaderboard from Google Sheets:', error);
    const isForbidden = error.code === 403 || error.response?.status === 403;
    const statusCode = isForbidden ? 403 : (error.statusCode || 500);
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'your service account email';
    const response = { error: 'Failed to fetch leaderboard from Google Sheets.' };
    if (isForbidden) {
      response.details = `Share the LEADERBOARD Google Sheet with ${serviceEmail} as Viewer (not only the Drive folder).`;
    }
    return res.status(statusCode).json(response);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

if (!process.env.VERCEL) {
  app.listen(API_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on http://localhost:${API_PORT}`);
  });
}

module.exports = app;
