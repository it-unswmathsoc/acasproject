import { useState, useEffect } from 'react';

export default function LandingPage({ onEnter }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const symbols = ['∑', 'π', '∫', '√', '∞', 'Δ', 'θ', 'λ', '∂', 'φ', '≈', '⊕'];
  const floaters = Array.from({ length: 18 }, (_, i) => ({
    sym: symbols[i % symbols.length],
    x: (i * 137.5) % 100,
    y: ((i * 67 + tick * 0.08) % 110) - 5,
    opacity: 0.06 + (i % 5) * 0.028,
    size: 16 + (i % 4) * 10,
  }));

  return (
    <div className="ms-page ms-page--landing">
      <div className="ms-page__noise" aria-hidden />
      {floaters.map((f, i) => (
        <div
          key={i}
          className="ms-floater"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: f.size,
            opacity: f.opacity,
          }}
        >
          {f.sym}
        </div>
      ))}
      <div className="ms-ambient-glow" aria-hidden />

      <div className="ms-glass-card ms-glass-card--hero ms-enter">
        <div className="ms-rule">
          <div className="ms-rule__line" />
          <span className="ms-overline">UNSW</span>
          <div className="ms-rule__line" />
        </div>

        <h1 className="ms-title-display">MathSoc</h1>
        <div className="ms-title-sub">Academics Portal</div>

        <p className="ms-body-lead">
          Weekly puzzles, math facts, and timed challenges — crafted by the Academics team for curious minds.
        </p>

        <button type="button" className="ms-btn-primary" onClick={onEnter}>
          Enter Portal
        </button>

        <p className="ms-hint-text">Directors sign in with your credentials below</p>
      </div>

      <div className="ms-footnote">Mathematics Society · UNSW Sydney</div>
    </div>
  );
}
