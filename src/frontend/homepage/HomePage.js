import { useEffect, useState } from 'react';
import { buildFloatingMathSymbols } from './animation';
import HomeTitles from './titles';
import RegisterButton from './register_button';

export default function HomePage({ onEnter }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const floaters = buildFloatingMathSymbols(tick);

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

        <HomeTitles />

        <p className="ms-body-lead">
          Weekly puzzles, math facts, and timed challenges - crafted by the Academics team for curious minds.
        </p>

        <RegisterButton onClick={onEnter} />
      </div>

      <div className="ms-footnote">Mathematics Society - UNSW Sydney</div>
    </div>
  );
}
