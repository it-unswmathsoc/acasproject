import { useMemo, useState } from 'react';

// TODO: Replace with Google Drive image URL/API output.
const QUESTION_IMAGE_URL = '';

export default function SubmissionPage({ onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [solution, setSolution] = useState('');

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Puzzle Submission - ${name || 'Anonymous'}`);
    const body = encodeURIComponent(
      `Name: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\n\nSolution:\n${solution || 'No solution entered'}`
    );
    const cc = email ? `&cc=${encodeURIComponent(email)}` : '';
    return `mailto:academics.unswmathsoc@gmail.com?subject=${subject}&body=${body}${cc}`;
  }, [name, email, solution]);

  return (
    <div className="ms-page" style={{ padding: '28px 20px 48px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Back
        </button>

        <div className="ms-glass-card" style={{ padding: '20px' }}>
          {QUESTION_IMAGE_URL ? (
            <img src={QUESTION_IMAGE_URL} alt="Current question" style={{ width: '100%', borderRadius: '10px', marginBottom: '18px' }} />
          ) : (
            <div style={{ border: '1px dashed var(--ms-border)', borderRadius: '10px', minHeight: '260px', display: 'grid', placeItems: 'center', color: 'var(--ms-muted-2)', marginBottom: '18px' }}>
              Image placeholder (Google Drive API integration pending)
            </div>
          )}

          <div className="ms-form-stack">
            <div>
              <label className="ms-label" htmlFor="submission-name">Name</label>
              <input id="submission-name" className="ms-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            </div>

            <div>
              <label className="ms-label" htmlFor="submission-email">Email</label>
              <input
                id="submission-email"
                type="email"
                className="ms-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="ms-label" htmlFor="submission-solution">Solution</label>
              <textarea
                id="submission-solution"
                className="ms-textarea"
                rows={8}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Write your full solution here..."
              />
            </div>

            <a href={mailtoHref} className="ms-btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', alignSelf: 'center' }}>
              Submit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
