import { useEffect, useState } from 'react';
import MathSolutionField from './MathSolutionField';
import { dismissMathLiveUI } from './dismissMathLiveUI';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:4000';

export default function SubmissionPage({ onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [solution, setSolution] = useState('');
  const [latexMode, setLatexMode] = useState(false);
  const [latestPdf, setLatestPdf] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadLatestPdf = async () => {
      try {
        setIsLoadingPdf(true);
        setPdfError('');

        const response = await fetch(`${API_BASE_URL}/api/latest-pdf`);
        if (!response.ok) {
          let message = 'Could not load latest PDF.';
          try {
            const errorData = await response.json();
            if (errorData?.details) {
              message = errorData.details;
            } else if (errorData?.error) {
              message = errorData.error;
            }
          } catch (parseError) {
            // Keep fallback message when error response is not JSON.
          }
          throw new Error(message);
        }

        const data = await response.json();
        setLatestPdf(data);
      } catch (error) {
        setPdfError(error.message || 'Failed to load latest PDF.');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    loadLatestPdf();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ms-math-mode-active', latexMode);
    if (!latexMode) {
      dismissMathLiveUI();
    }
    return () => {
      document.body.classList.remove('ms-math-mode-active');
      dismissMathLiveUI();
    };
  }, [latexMode]);

  const handleMathModeToggle = () => {
    if (latexMode) {
      dismissMathLiveUI();
    }
    setLatexMode((on) => !on);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isSubmitted) {
      return;
    }

    if (!solution.trim()) {
      setSubmitError('Solution is required.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, solution, latexMode })
      });

      if (!response.ok) {
        let message = 'Failed to send submission.';
        try {
          const errorData = await response.json();
          message = errorData?.details || errorData?.error || message;
        } catch (parseError) {
          // Keep fallback message when response is not JSON.
        }
        throw new Error(message);
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'Failed to send submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ms-page" style={{ padding: '28px 20px 48px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Back
        </button>

        <div className="ms-glass-card" style={{ padding: '20px' }}>
          {isLoadingPdf ? (
            <div style={{ border: '1px dashed var(--ms-border)', borderRadius: '10px', minHeight: '260px', display: 'grid', placeItems: 'center', color: 'var(--ms-muted-2)', marginBottom: '18px' }}>
              Loading latest question PDF...
            </div>
          ) : latestPdf ? (
            <div style={{ marginBottom: '18px' }}>
              <iframe
                src={
                  latestPdf.embedUrl?.startsWith('http')
                    ? latestPdf.embedUrl
                    : `${API_BASE_URL}${latestPdf.embedUrl || '/api/latest-pdf/content'}`
                }
                title={latestPdf.name || 'Current question PDF'}
                style={{ width: '100%', minHeight: '600px', border: '1px solid var(--ms-border)', borderRadius: '10px' }}
              />
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--ms-border)', borderRadius: '10px', minHeight: '260px', display: 'grid', placeItems: 'center', color: 'var(--ms-muted-2)', marginBottom: '18px' }}>
              {pdfError || 'No PDF found yet. Upload a PDF to your Drive folder.'}
            </div>
          )}

          <form className="ms-form-stack" onSubmit={handleSubmit}>
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
              <div className="ms-solution-header">
                <label className="ms-label" htmlFor="submission-solution">Solution</label>
                <button
                  type="button"
                  className={`ms-latex-toggle${latexMode ? ' ms-latex-toggle--on' : ''}`}
                  onClick={handleMathModeToggle}
                  aria-pressed={latexMode}
                >
                  Math mode {latexMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="ms-math-hint">
                {latexMode
                  ? 'Type naturally — fractions, exponents, and roots format as you write (like Desmos).'
                  : 'Turn on Math mode for automatic math formatting.'}
              </p>
              {latexMode ? (
                <MathSolutionField id="submission-solution" value={solution} onChange={setSolution} />
              ) : (
                <textarea
                  id="submission-solution"
                  className="ms-textarea"
                  rows={8}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Write your full solution here..."
                  required
                />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSubmitted ? (
                <span style={{ color: '#4ade80', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  ✓ Submitted
                </span>
              ) : (
                <button
                  type="submit"
                  className="ms-btn-secondary"
                  style={{ display: 'inline-block' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
              )}
            </div>
          </form>
          {submitError ? (
            <div style={{ marginTop: '10px', color: '#f87171', textAlign: 'center' }}>
              {submitError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
