import { useMemo } from 'react';
import { buildFloatingMathSymbols } from './animation';
import HomeTitles from './titles';
import LeaderboardTable from '../leaderboardpage/LeaderboardTable';

export default function HomePage({ onEnter }) {
  const floaters = useMemo(() => buildFloatingMathSymbols(), []);

  return (
    <div className="ms-page ms-page--landing">
      <div className="ms-page__bg" aria-hidden>
        <div className="ms-page__noise" />
        {floaters.map((f, i) => (
          <div key={i} className="ms-floater-lane" style={{ left: `${f.x}%` }}>
            <div
              className="ms-floater"
              style={{
                fontSize: f.size,
                opacity: f.opacity,
                color: '#f4c542',
                '--ms-floater-duration': f.duration,
                '--ms-floater-delay': f.delay,
                '--ms-floater-drift': f.drift,
              }}
            >
              {f.sym}
            </div>
          </div>
        ))}
        <div className="ms-ambient-glow" />
      </div>

      <div className="ms-home-stack">
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

          <button type="button" className="ms-btn-primary" onClick={onEnter}>
            Get Started
          </button>
        </div>

        <div className="ms-glass-card ms-glass-card--leaderboard ms-enter" style={{ animationDelay: '0.15s' }}>
          <LeaderboardTable />
        </div>

        <p className="ms-footnote ms-footnote--flow">Mathematics Society - UNSW Sydney</p>
      </div>
    </div>
  );
}
