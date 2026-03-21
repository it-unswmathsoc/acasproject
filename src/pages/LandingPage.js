import { useState, useEffect } from 'react';

export default function LandingPage({ onEnter }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const symbols = ['∑', 'π', '∫', '√', '∞', 'Δ', 'θ', 'λ', '∂', 'φ', '≈', '⊕', '∀', '∃', '≠', '≤', '≥', '⊂', '⊆', '∈'];
  const floaters = Array.from({ length: 34 }, (_, i) => ({
    sym: symbols[i % symbols.length],
    x: (i * 89.3) % 100,
    y: ((i * 41 + tick * (0.2 + (i % 5) * 0.04)) % 125) - 10,
    opacity: 0.14 + (i % 6) * 0.055,
    size: 18 + (i % 6) * 8,
    hue: (i * 23) % 360,
    drift: ((i % 7) - 3) * 0.08,
  }));

  return (
    <div className="ms-page ms-page--landing">
      <div className="ms-page__noise" aria-hidden />
      {floaters.map((f, i) => (
        <div
          key={i}
          className="ms-floater"
          style={{
            left: `${f.x + Math.sin((tick + i * 9) * 0.05) * f.drift}%`,
            top: `${f.y}%`,
            fontSize: f.size,
            opacity: f.opacity,
            color: '#f4c542',
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

      </div>

      <div className="ms-footnote">Mathematics Society · UNSW Sydney</div>
    </div>
  );
}
