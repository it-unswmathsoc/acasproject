import { useState, useEffect, useRef } from "react";

// ── Katex via CDN ──────────────────────────────────────────────────────────
const katexCSS = document.createElement("link");
katexCSS.rel = "stylesheet";
katexCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
document.head.appendChild(katexCSS);

const katexScript = document.createElement("script");
katexScript.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
document.head.appendChild(katexScript);

// ── Google Fonts ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap";
document.head.appendChild(fontLink);

// ── Seed Data ──────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  users: [
    { id: 1, username: "mathsoc_director", email: "director@mathsoc.unsw.edu.au", password: "director123", role: "director", createdAt: "2025-01-01" },
    { id: 2, username: "alice", email: "alice@unsw.edu.au", password: "alice123", role: "student", createdAt: "2025-01-05" },
  ],
  currentUser: null,
  question: {
    id: 1,
    title: "Welcome Puzzle — Week 1",
    body: "Let $f: \\mathbb{R} \\to \\mathbb{R}$ be defined by $f(x) = x^2 + 2x + 1$.\n\nFind all $x$ such that $f(x) = f(-x)$, and prove your answer.",
    hint: "Consider the symmetry of the function around $x = -1$.",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    postedBy: "mathsoc_director",
    postedAt: new Date().toISOString(),
    funFact: "The function $f(x) = (x+1)^2$ is a perfect square trinomial — one of the simplest parabolas in disguise!",
  },
  submissions: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function genId() { return Date.now() + Math.random(); }
function formatDeadline(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
function timeLeft(iso) {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return "Closed";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

// ── LaTeX Renderer ─────────────────────────────────────────────────────────
function LatexRender({ src, block = false }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const render = () => {
      if (!window.katex) return setTimeout(render, 100);
      try {
        if (block) {
          // render block math and inline math mixed
          let html = src
            .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => {
              try { return `<span class="block-math">${window.katex.renderToString(m, { displayMode: true, throwOnError: false })}</span>`; } catch { return `$$${m}$$`; }
            })
            .replace(/\$([^$\n]+?)\$/g, (_, m) => {
              try { return window.katex.renderToString(m, { displayMode: false, throwOnError: false }); } catch { return `$${m}$`; }
            });
          ref.current.innerHTML = html;
        } else {
          let html = src
            .replace(/\$\$([^$]+?)\$\$/g, (_, m) => {
              try { return window.katex.renderToString(m, { displayMode: true, throwOnError: false }); } catch { return _; }
            })
            .replace(/\$([^$\n]+?)\$/g, (_, m) => {
              try { return window.katex.renderToString(m, { displayMode: false, throwOnError: false }); } catch { return _; }
            });
          ref.current.innerHTML = html;
        }
      } catch (e) { ref.current.textContent = src; }
    };
    render();
  }, [src, block]);
  return <span ref={ref} />;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1208;
    --paper: #f7f3ec;
    --cream: #ede8df;
    --gold: #c8922a;
    --gold-light: #e8b84b;
    --rust: #9b3d1c;
    --sage: #4a6741;
    --muted: #7a6e5f;
    --border: #d4ccbc;
    --shadow: rgba(26,18,8,0.12);
  }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); }
  .mono { font-family: 'DM Mono', monospace; }
  .serif { font-family: 'Playfair Display', serif; }

  /* ─ NAV ─ */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--ink); color: var(--paper);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; height: 56px;
    border-bottom: 2px solid var(--gold);
  }
  .nav-brand { font-family: 'Playfair Display', serif; font-size: 1.2rem; letter-spacing: 0.03em; }
  .nav-brand span { color: var(--gold); }
  .nav-right { display: flex; align-items: center; gap: 1rem; }
  .nav-user { font-size: 0.8rem; opacity: 0.7; font-family: 'DM Mono', monospace; }
  .nav-role { font-size: 0.65rem; padding: 2px 8px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.1em; }
  .role-director { background: var(--gold); color: var(--ink); }
  .role-student { background: var(--sage); color: white; }
  .btn { cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-ghost { background: transparent; color: var(--paper); border: 1px solid rgba(255,255,255,0.3); padding: 6px 14px; font-size: 0.82rem; border-radius: 2px; }
  .btn-ghost:hover { background: rgba(255,255,255,0.1); }

  /* ─ HERO ─ */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--ink);
    background-image: radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(155,61,28,0.06) 0%, transparent 50%);
    color: var(--paper); position: relative; overflow: hidden;
    padding: 80px 2rem 4rem;
  }
  .hero-grid {
    position: absolute; inset: 0; opacity: 0.04;
    background-image: linear-gradient(var(--paper) 1px, transparent 1px),
                      linear-gradient(90deg, var(--paper) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .hero-eyebrow {
    font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .hero-eyebrow::before, .hero-eyebrow::after {
    content: ''; display: block; width: 40px; height: 1px; background: var(--gold); opacity: 0.5;
  }
  .hero-title {
    font-family: 'Playfair Display', serif; font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 900; line-height: 0.95; text-align: center;
    margin-bottom: 1.5rem; max-width: 800px;
  }
  .hero-title em { color: var(--gold); font-style: italic; }
  .hero-sub {
    font-size: 1.05rem; color: rgba(247,243,236,0.6); text-align: center;
    max-width: 480px; line-height: 1.7; margin-bottom: 3rem;
  }
  .hero-cta {
    display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
  }
  .btn-primary {
    background: var(--gold); color: var(--ink); padding: 12px 28px;
    font-weight: 600; font-size: 0.9rem; border-radius: 2px; letter-spacing: 0.03em;
  }
  .btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }
  .btn-outline {
    background: transparent; color: var(--paper); padding: 12px 28px;
    font-weight: 500; font-size: 0.9rem; border-radius: 2px;
    border: 1px solid rgba(247,243,236,0.3);
  }
  .btn-outline:hover { background: rgba(247,243,236,0.05); }
  .scroll-hint {
    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.15em;
    color: rgba(247,243,236,0.3); text-transform: uppercase;
  }
  .scroll-arrow { width: 1px; height: 40px; background: linear-gradient(var(--gold), transparent); animation: scrollPulse 2s ease-in-out infinite; }
  @keyframes scrollPulse { 0%,100%{opacity:0.3;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.1)} }

  /* ─ PUZZLE SECTION ─ */
  .puzzle-section {
    max-width: 820px; margin: 0 auto; padding: 5rem 2rem 8rem;
  }
  .section-label {
    font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 2rem;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .question-card {
    background: white; border: 1px solid var(--border); border-radius: 4px;
    box-shadow: 0 4px 24px var(--shadow), 0 1px 0 var(--gold) inset;
    overflow: hidden; margin-bottom: 2.5rem;
  }
  .qcard-header {
    background: var(--ink); color: var(--paper);
    padding: 1.25rem 1.75rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  }
  .qcard-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; }
  .qcard-meta { font-family: 'DM Mono', monospace; font-size: 0.7rem; opacity: 0.5; margin-top: 0.35rem; }
  .deadline-badge {
    font-family: 'DM Mono', monospace; font-size: 0.68rem; padding: 4px 10px;
    border-radius: 2px; white-space: nowrap; flex-shrink: 0;
    background: var(--gold); color: var(--ink); font-weight: 600;
  }
  .deadline-badge.urgent { background: var(--rust); color: white; animation: urgentPulse 2s ease-in-out infinite; }
  @keyframes urgentPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
  .qcard-body { padding: 2rem 1.75rem; }
  .qcard-text {
    font-size: 1.05rem; line-height: 1.85; color: var(--ink);
    white-space: pre-wrap;
  }
  .qcard-text .block-math { display: block; text-align: center; margin: 1rem 0; }
  .hint-box {
    margin-top: 1.5rem; padding: 1rem 1.25rem;
    background: #fdf8f0; border-left: 3px solid var(--gold);
    border-radius: 0 2px 2px 0;
  }
  .hint-label { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem; }
  .fun-fact-box {
    margin-top: 1rem; padding: 1rem 1.25rem;
    background: #f0f5f0; border-left: 3px solid var(--sage);
    border-radius: 0 2px 2px 0;
  }
  .fun-fact-label { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--sage); margin-bottom: 0.4rem; }

  /* ─ ANSWER SECTION ─ */
  .answer-section { margin-top: 2.5rem; }
  .answer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap; }
  .answer-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; }
  .mode-toggle { display: flex; gap: 0; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; }
  .mode-btn { background: white; border: none; padding: 7px 14px; font-size: 0.78rem; cursor: pointer; font-family: 'DM Mono', monospace; color: var(--muted); transition: all 0.12s; }
  .mode-btn.active { background: var(--ink); color: var(--paper); }
  .mode-btn:hover:not(.active) { background: var(--cream); }

  .answer-editor { position: relative; }
  .answer-textarea {
    width: 100%; min-height: 140px; padding: 1rem 1.25rem;
    border: 1px solid var(--border); border-radius: 3px; resize: vertical;
    font-family: 'DM Mono', monospace; font-size: 0.88rem; line-height: 1.7;
    background: white; color: var(--ink); transition: border-color 0.15s;
    outline: none;
  }
  .answer-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(200,146,42,0.1); }
  .latex-hint { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: var(--muted); margin-top: 0.5rem; }
  .latex-hint code { background: var(--cream); padding: 1px 5px; border-radius: 2px; color: var(--rust); }

  .preview-box {
    background: white; border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; min-height: 80px;
    font-size: 1rem; line-height: 1.8; color: var(--ink);
  }
  .preview-empty { color: var(--muted); font-style: italic; font-size: 0.88rem; }

  .answer-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; gap: 1rem; flex-wrap: wrap; }
  .char-count { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--muted); }
  .btn-submit {
    background: var(--ink); color: var(--paper); padding: 11px 26px;
    font-size: 0.88rem; font-weight: 600; border-radius: 2px; letter-spacing: 0.03em;
    border: 1px solid transparent; transition: all 0.15s;
  }
  .btn-submit:hover { background: var(--gold); color: var(--ink); }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

  .success-banner {
    background: #edf5ed; border: 1px solid #a8c8a8; border-radius: 3px;
    padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;
    font-size: 0.9rem; color: #2d5a2d;
  }
  .success-icon { font-size: 1.2rem; }

  /* ─ MODAL ─ */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,18,8,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .modal {
    background: white; border-radius: 4px; width: 100%; max-width: 460px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
  }
  .modal-header {
    background: var(--ink); color: var(--paper); padding: 1.25rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; }
  .modal-close { background: none; border: none; color: var(--paper); cursor: pointer; font-size: 1.2rem; opacity: 0.6; transition: opacity 0.12s; }
  .modal-close:hover { opacity: 1; }
  .modal-body { padding: 1.5rem; }
  .modal-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
  .modal-tab { background: none; border: none; padding: 10px 18px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.12s; margin-bottom: -1px; }
  .modal-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 600; }

  .field { margin-bottom: 1.1rem; }
  .field label { display: block; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.4rem; }
  .field input {
    width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 3px;
    font-family: 'DM Sans', sans-serif; font-size: 0.92rem; color: var(--ink);
    outline: none; transition: border-color 0.12s;
  }
  .field input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(200,146,42,0.1); }
  .field-error { font-size: 0.75rem; color: var(--rust); margin-top: 0.35rem; }

  .btn-full { width: 100%; padding: 12px; font-size: 0.92rem; }
  .modal-switch { text-align: center; font-size: 0.82rem; color: var(--muted); margin-top: 1rem; }
  .modal-switch button { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 0.82rem; text-decoration: underline; }

  /* ─ DIRECTOR PANEL ─ */
  .director-page {
    min-height: 100vh; background: var(--paper); padding-top: 56px;
  }
  .director-header {
    background: var(--ink); color: var(--paper);
    padding: 2.5rem 2rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .director-eyebrow {
    font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.75rem;
  }
  .director-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; margin-bottom: 0.25rem; }
  .director-sub { font-size: 0.88rem; opacity: 0.5; margin-bottom: 1.5rem; }
  .dir-tabs { display: flex; gap: 0; }
  .dir-tab {
    background: none; border: none; color: rgba(247,243,236,0.5);
    padding: 12px 24px; font-size: 0.88rem; cursor: pointer;
    font-family: 'DM Sans', sans-serif; border-bottom: 2px solid transparent;
    transition: all 0.15s; margin-bottom: -1px;
  }
  .dir-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .dir-tab:hover:not(.active) { color: var(--paper); }

  .director-content { max-width: 860px; margin: 0 auto; padding: 2.5rem 2rem; }

  /* Preview tab */
  .preview-card {
    background: white; border: 1px solid var(--border); border-radius: 4px;
    overflow: hidden; box-shadow: 0 2px 12px var(--shadow);
  }
  .preview-card .qcard-header { background: var(--ink); }

  .stats-row { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .stat-box {
    flex: 1; min-width: 120px; background: white; border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; text-align: center;
  }
  .stat-num { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--gold); }
  .stat-label { font-family: 'DM Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 0.25rem; }

  .submissions-list { margin-top: 2rem; }
  .sub-item {
    background: white; border: 1px solid var(--border); border-radius: 3px;
    padding: 1rem 1.25rem; margin-bottom: 0.75rem;
    display: flex; align-items: flex-start; gap: 1rem;
  }
  .sub-user { font-family: 'DM Mono', monospace; font-size: 0.78rem; color: var(--gold); font-weight: 600; min-width: 100px; }
  .sub-answer { font-size: 0.88rem; color: var(--ink); flex: 1; word-break: break-word; }
  .sub-time { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: var(--muted); white-space: nowrap; }

  /* Edit tab */
  .edit-form { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 2rem; }
  .edit-field { margin-bottom: 1.5rem; }
  .edit-label { display: block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem; }
  .edit-input, .edit-textarea {
    width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 3px;
    font-family: 'DM Mono', monospace; font-size: 0.88rem; color: var(--ink);
    outline: none; transition: border-color 0.12s; background: var(--paper);
  }
  .edit-textarea { min-height: 180px; resize: vertical; line-height: 1.6; }
  .edit-input:focus, .edit-textarea:focus { border-color: var(--gold); background: white; box-shadow: 0 0 0 3px rgba(200,146,42,0.1); }
  .edit-note { font-size: 0.75rem; color: var(--muted); margin-top: 0.35rem; }
  .edit-actions { display: flex; gap: 1rem; margin-top: 2rem; }
  .btn-publish {
    background: var(--gold); color: var(--ink); padding: 12px 28px;
    font-size: 0.9rem; font-weight: 700; border-radius: 2px; border: none;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.03em;
  }
  .btn-publish:hover { background: var(--gold-light); transform: translateY(-1px); }
  .edit-preview { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
  .edit-preview-label { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }

  .toast {
    position: fixed; bottom: 2rem; right: 2rem; z-index: 300;
    background: var(--ink); color: var(--paper); padding: 12px 20px;
    border-radius: 3px; font-size: 0.88rem; border-left: 3px solid var(--gold);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: toastIn 0.3s ease;
  }
  @keyframes toastIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

  .login-wall {
    text-align: center; padding: 3rem 1rem;
    background: white; border: 1px solid var(--border); border-radius: 4px;
  }
  .login-wall h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 0.75rem; }
  .login-wall p { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem; }

  .closed-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: var(--cream); border: 1px solid var(--border); border-radius: 2px;
    padding: 3px 10px; font-family: 'DM Mono', monospace; font-size: 0.68rem;
    color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase;
  }
  .already-submitted {
    background: #fdf8f0; border: 1px solid #e8c880; border-radius: 3px;
    padding: 1rem 1.25rem; font-size: 0.9rem; color: #7a5a10;
    display: flex; align-items: center; gap: 0.75rem;
  }
`;

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [modal, setModal] = useState(null); // 'login' | 'signup' | null
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const login = (email, password) => {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) return "Invalid email or password.";
    setState(s => ({ ...s, currentUser: user }));
    setModal(null);
    showToast(`Welcome back, ${user.username}!`);
    return null;
  };

  const signup = (username, email, password) => {
    if (state.users.find(u => u.email === email)) return "Email already registered.";
    if (state.users.find(u => u.username === username)) return "Username taken.";
    const newUser = { id: genId(), username, email, password, role: "student", createdAt: new Date().toISOString() };
    setState(s => ({ ...s, users: [...s.users, newUser], currentUser: newUser }));
    setModal(null);
    showToast(`Welcome to MathSoc Puzzles, ${username}!`);
    return null;
  };

  const logout = () => {
    setState(s => ({ ...s, currentUser: null }));
    showToast("Logged out.");
  };

  const submitAnswer = (answer, mode) => {
    const sub = {
      id: genId(), questionId: state.question.id,
      userId: state.currentUser.id, username: state.currentUser.username,
      answer, mode, submittedAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, submissions: [...s.submissions, sub] }));
    showToast("Answer submitted! Good luck. 🎉");
  };

  const updateQuestion = (q) => {
    setState(s => ({ ...s, question: { ...q, postedBy: s.currentUser.username, postedAt: new Date().toISOString() } }));
    showToast("Question updated and published!");
  };

  const isDirector = state.currentUser?.role === "director";
  const mySubmission = state.submissions.find(
    s => s.questionId === state.question.id && s.userId === state.currentUser?.id
  );
  const questionSubmissions = state.submissions.filter(s => s.questionId === state.question.id);

  return (
    <>
      <style>{css}</style>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-brand">UNSW <span>Math</span>Soc</div>
        <div className="nav-right">
          {state.currentUser ? (
            <>
              <span className="nav-user">{state.currentUser.username}</span>
              <span className={`nav-role ${isDirector ? "role-director" : "role-student"}`}>
                {state.currentUser.role}
              </span>
              <button className="btn btn-ghost" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setModal("login")}>Log in</button>
              <button className="btn btn-primary btn" onClick={() => setModal("signup")} style={{fontSize:"0.82rem",padding:"6px 14px",borderRadius:"2px"}}>Join</button>
            </>
          )}
        </div>
      </nav>

      {/* DIRECTOR VIEW */}
      {isDirector ? (
        <DirectorPanel
          question={state.question}
          submissions={questionSubmissions}
          users={state.users}
          onUpdate={updateQuestion}
        />
      ) : (
        <>
          {/* HERO */}
          <section className="hero">
            <div className="hero-grid" />
            <div className="hero-eyebrow">UNSW MathSoc — Weekly Puzzles</div>
            <h1 className="hero-title">
              Think.<br /><em>Solve.</em><br />Grow.
            </h1>
            <p className="hero-sub">
              A weekly mathematical challenge from the UNSW Mathematics Society. 
              Test your reasoning. Submit your proof. See how others think.
            </p>
            <div className="hero-cta">
              <a href="#puzzle">
                <button className="btn btn-primary">View this week's puzzle ↓</button>
              </a>
              {!state.currentUser && (
                <button className="btn btn-outline" onClick={() => setModal("signup")}>
                  Create account
                </button>
              )}
            </div>
            <div className="scroll-hint">
              <div className="scroll-arrow" />
              scroll
            </div>
          </section>

          {/* PUZZLE */}
          <section className="puzzle-section" id="puzzle">
            <div className="section-label">This week's challenge</div>
            <QuestionCard question={state.question} />
            <AnswerArea
              question={state.question}
              currentUser={state.currentUser}
              mySubmission={mySubmission}
              onSubmit={submitAnswer}
              onLoginPrompt={() => setModal("login")}
            />
          </section>
        </>
      )}

      {/* MODALS */}
      {modal && (
        <AuthModal
          mode={modal}
          onClose={() => setModal(null)}
          onSwitchMode={m => setModal(m)}
          onLogin={login}
          onSignup={signup}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ── Question Card ──────────────────────────────────────────────────────────
function QuestionCard({ question }) {
  const [showHint, setShowHint] = useState(false);
  const tl = timeLeft(question.deadline);
  const isUrgent = new Date(question.deadline) - Date.now() < 24 * 3600000;

  return (
    <div className="question-card">
      <div className="qcard-header">
        <div>
          <div className="qcard-title">{question.title}</div>
          <div className="qcard-meta">
            Posted by {question.postedBy} · {new Date(question.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className={`deadline-badge ${isUrgent && tl !== "Closed" ? "urgent" : ""}`}>
          {tl === "Closed" ? "⛔ Closed" : `⏳ ${tl}`}
        </div>
      </div>
      <div className="qcard-body">
        <div className="qcard-text">
          <LatexRender src={question.body} block />
        </div>
        {question.funFact && (
          <div className="fun-fact-box">
            <div className="fun-fact-label">✦ Fun Fact</div>
            <LatexRender src={question.funFact} />
          </div>
        )}
        {question.hint && (
          <>
            {!showHint ? (
              <button
                className="btn"
                onClick={() => setShowHint(true)}
                style={{ marginTop: "1.25rem", background: "var(--cream)", color: "var(--ink)", padding: "8px 16px", borderRadius: "2px", fontSize: "0.82rem", border: "1px solid var(--border)" }}
              >
                🔍 Reveal hint
              </button>
            ) : (
              <div className="hint-box">
                <div className="hint-label">Hint</div>
                <LatexRender src={question.hint} />
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "var(--muted)" }}>
            Deadline: {formatDeadline(question.deadline)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Answer Area ────────────────────────────────────────────────────────────
function AnswerArea({ question, currentUser, mySubmission, onSubmit, onLoginPrompt }) {
  const [mode, setMode] = useState("both"); // 'latex' | 'text' | 'both'
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isClosed = new Date(question.deadline) <= Date.now();

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmit(answer, mode);
    setSubmitted(true);
  };

  if (!currentUser) {
    return (
      <div className="login-wall">
        <h3>Ready to submit your answer?</h3>
        <p>Create an account or log in to submit your solution.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={onLoginPrompt}>Log in</button>
        </div>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="login-wall">
        <h3>This puzzle is closed.</h3>
        <p>The deadline has passed. Check back for next week's puzzle!</p>
      </div>
    );
  }

  if (mySubmission || submitted) {
    return (
      <div className="answer-section">
        <div className="success-banner">
          <span className="success-icon">✓</span>
          <div>
            <strong>Answer submitted!</strong> Thanks for participating. Results will be announced after the deadline.
            <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "#f7f3ec", borderRadius: "3px", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.4rem" }}>Your submission</div>
              <LatexRender src={mySubmission?.answer || answer} block />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-section">
      <div className="answer-header">
        <h3 className="answer-title">Your Answer</h3>
        <div className="mode-toggle">
          {["latex", "text", "both"].map(m => (
            <button key={m} className={`mode-btn ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
              {m === "latex" ? "LaTeX" : m === "text" ? "Text" : "Both"}
            </button>
          ))}
        </div>
      </div>

      {(mode === "latex" || mode === "both") && (
        <div style={{ marginBottom: mode === "both" ? "1rem" : "0" }}>
          {mode === "both" && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.4rem" }}>LaTeX / Math</div>}
          <textarea
            className="answer-textarea"
            placeholder="Write your mathematical answer here. Use $...$ for inline math and $$...$$ for display math. E.g. $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$"
            value={mode === "both" ? undefined : answer}
            onChange={mode === "both" ? undefined : e => setAnswer(e.target.value)}
            style={mode === "both" ? { minHeight: "100px" } : {}}
            id={mode === "both" ? "latex-part" : undefined}
          />
          {mode !== "both" && (
            <>
              <p className="latex-hint">
                Inline math: <code>$x^2 + 1$</code> → display as inline · Block: <code>$$\int_0^1 f(x)\,dx$$</code>
              </p>
              {answer && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div className="latex-hint" style={{ marginBottom: "0.35rem" }}>Preview:</div>
                  <div className="preview-box">
                    <LatexRender src={answer} block />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mode === "both" && (
        <CombinedEditor onAnswerChange={setAnswer} />
      )}

      {mode === "text" && (
        <textarea
          className="answer-textarea"
          placeholder="Write your answer in plain text..."
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
      )}

      <div className="answer-footer">
        <span className="char-count">{answer.length} characters</span>
        <button
          className="btn btn-submit"
          onClick={handleSubmit}
          disabled={!answer.trim()}
        >
          Submit Answer →
        </button>
      </div>
    </div>
  );
}

function CombinedEditor({ onAnswerChange }) {
  const [latex, setLatex] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const combined = [latex && `[LaTeX]\n${latex}`, text && `[Text]\n${text}`].filter(Boolean).join("\n\n");
    onAnswerChange(combined);
  }, [latex, text]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.4rem" }}>LaTeX / Math</div>
        <textarea className="answer-textarea" style={{ minHeight: "100px" }} placeholder="$f(x) = x^2$, or $$\int_0^1 x\,dx = \frac{1}{2}$$" value={latex} onChange={e => setLatex(e.target.value)} />
        {latex && (
          <div className="preview-box" style={{ marginTop: "0.5rem" }}>
            <LatexRender src={latex} block />
          </div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.4rem" }}>Written Explanation</div>
        <textarea className="answer-textarea" style={{ minHeight: "100px" }} placeholder="Explain your reasoning in plain English..." value={text} onChange={e => setText(e.target.value)} />
      </div>
    </div>
  );
}

// ── Auth Modal ─────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onSwitchMode, onLogin, onSignup }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    let err;
    if (mode === "login") {
      err = onLogin(email, password);
    } else {
      if (!username.trim()) { setError("Username is required."); return; }
      err = onSignup(username.trim(), email, password);
    }
    if (err) setError(err);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{mode === "login" ? "Welcome back" : "Join MathSoc Puzzles"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-tabs">
            <button className={`modal-tab ${mode === "login" ? "active" : ""}`} onClick={() => onSwitchMode("login")}>Log in</button>
            <button className={`modal-tab ${mode === "signup" ? "active" : ""}`} onClick={() => onSwitchMode("signup")}>Sign up</button>
          </div>
          {mode === "signup" && (
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey} placeholder="e.g. mathwiz42" autoFocus />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="you@unsw.edu.au" autoFocus={mode === "login"} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
            {error && <div className="field-error">⚠ {error}</div>}
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSubmit}>
            {mode === "login" ? "Log in" : "Create account"}
          </button>
          {mode === "login" && (
            <div className="modal-switch" style={{marginTop:"1rem",fontSize:"0.78rem",color:"var(--muted)"}}>
              Demo: <code style={{fontSize:"0.75rem"}}>director@mathsoc.unsw.edu.au</code> / <code style={{fontSize:"0.75rem"}}>director123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Director Panel ─────────────────────────────────────────────────────────
function DirectorPanel({ question, submissions, users, onUpdate }) {
  const [tab, setTab] = useState("preview");
  const [draft, setDraft] = useState({ ...question });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft({ ...question }); }, [question]);

  const handlePublish = () => {
    onUpdate({ ...draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="director-page">
      <div className="director-header">
        <div className="director-eyebrow">Director Dashboard</div>
        <h1 className="director-title">Puzzle Control</h1>
        <p className="director-sub">Manage weekly questions and track submissions.</p>
        <div className="dir-tabs">
          <button className={`dir-tab ${tab === "preview" ? "active" : ""}`} onClick={() => setTab("preview")}>
            📋 Current Question
          </button>
          <button className={`dir-tab ${tab === "edit" ? "active" : ""}`} onClick={() => setTab("edit")}>
            ✏️ Edit Question
          </button>
        </div>
      </div>

      <div className="director-content">
        {tab === "preview" && (
          <>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-num">{submissions.length}</div>
                <div className="stat-label">Submissions</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{users.filter(u => u.role === "student").length}</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{timeLeft(question.deadline) === "Closed" ? "0" : timeLeft(question.deadline).split("d")[0] || "—"}</div>
                <div className="stat-label">Days Left</div>
              </div>
            </div>

            <div className="section-label" style={{ marginBottom: "1rem" }}>Live Question Preview</div>
            <div className="preview-card">
              <div className="qcard-header">
                <div>
                  <div className="qcard-title">{question.title}</div>
                  <div className="qcard-meta">Deadline: {formatDeadline(question.deadline)}</div>
                </div>
                <div className={`deadline-badge`}>{timeLeft(question.deadline)}</div>
              </div>
              <div className="qcard-body">
                <div className="qcard-text"><LatexRender src={question.body} block /></div>
                {question.hint && (
                  <div className="hint-box" style={{ marginTop: "1rem" }}>
                    <div className="hint-label">Hint</div>
                    <LatexRender src={question.hint} />
                  </div>
                )}
                {question.funFact && (
                  <div className="fun-fact-box" style={{ marginTop: "1rem" }}>
                    <div className="fun-fact-label">Fun Fact</div>
                    <LatexRender src={question.funFact} />
                  </div>
                )}
              </div>
            </div>

            {submissions.length > 0 && (
              <div className="submissions-list">
                <div className="section-label" style={{ margin: "2rem 0 1rem" }}>Submissions ({submissions.length})</div>
                {submissions.map(s => (
                  <div key={s.id} className="sub-item">
                    <div className="sub-user">@{s.username}</div>
                    <div className="sub-answer"><LatexRender src={s.answer} block /></div>
                    <div className="sub-time">{new Date(s.submittedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))}
              </div>
            )}
            {submissions.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}>
                No submissions yet.
              </div>
            )}
          </>
        )}

        {tab === "edit" && (
          <div className="edit-form">
            <div className="section-label" style={{ marginBottom: "1.5rem" }}>Edit & Publish Question</div>

            <div className="edit-field">
              <label className="edit-label">Question Title</label>
              <input className="edit-input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Week 2 — Combinatorics Challenge" />
            </div>

            <div className="edit-field">
              <label className="edit-label">Question Body (LaTeX supported)</label>
              <textarea className="edit-textarea" value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} placeholder="Use $...$ for inline and $$...$$ for display math." />
              <p className="edit-note">Supports inline math <code style={{fontSize:"0.75rem",background:"var(--cream)",padding:"1px 5px",borderRadius:"2px"}}>$x^2$</code> and block math <code style={{fontSize:"0.75rem",background:"var(--cream)",padding:"1px 5px",borderRadius:"2px"}}>$$\int f\,dx$$</code></p>
            </div>

            <div className="edit-field">
              <label className="edit-label">Hint (optional)</label>
              <input className="edit-input" value={draft.hint} onChange={e => setDraft(d => ({ ...d, hint: e.target.value }))} placeholder="A nudge in the right direction..." />
            </div>

            <div className="edit-field">
              <label className="edit-label">Fun Fact (optional)</label>
              <input className="edit-input" value={draft.funFact} onChange={e => setDraft(d => ({ ...d, funFact: e.target.value }))} placeholder="An interesting related fact..." />
            </div>

            <div className="edit-field">
              <label className="edit-label">Deadline</label>
              <input className="edit-input" type="datetime-local" value={draft.deadline?.slice(0, 16)} onChange={e => setDraft(d => ({ ...d, deadline: new Date(e.target.value).toISOString() }))} />
            </div>

            <div className="edit-actions">
              <button className="btn-publish" onClick={handlePublish}>
                {saved ? "✓ Published!" : "Publish Question →"}
              </button>
            </div>

            <div className="edit-preview">
              <div className="edit-preview-label">Live Preview</div>
              <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "3px", padding: "1.25rem" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>{draft.title || "Untitled"}</div>
                <div style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  <LatexRender src={draft.body} block />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
