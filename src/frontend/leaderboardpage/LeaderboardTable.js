import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:4000';

function leaderboardGridTemplate(columns) {
  return columns
    .map((col) => {
      const k = col.key.toLowerCase();
      if (k === 'rank') return 'minmax(52px, 0.55fr)';
      if (k === 'name') return 'minmax(140px, 1.6fr)';
      return 'minmax(88px, 1fr)';
    })
    .join(' ');
}

export default function LeaderboardTable({ showRefresh = true }) {
  const [columns, setColumns] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const gridStyle = useMemo(
    () => ({ '--ms-lb-columns': leaderboardGridTemplate(columns) }),
    [columns]
  );

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (!response.ok) {
        let message = 'Could not load leaderboard.';
        try {
          const errorData = await response.json();
          message = errorData?.details || errorData?.error || message;
        } catch (parseError) {
          // Keep fallback when response is not JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      setColumns(data.columns || []);
      setEntries(data.entries || []);
    } catch (err) {
      setColumns([]);
      setEntries([]);
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="ms-leaderboard-panel">
      <div className="ms-leaderboard-panel__header">
        <div>
          <p className="ms-overline" style={{ marginBottom: '6px' }}>Live standings</p>
          <h2 className="ms-title-section" style={{ margin: 0, fontSize: '1.35rem' }}>
            Leaderboard
          </h2>
        </div>
        {showRefresh ? (
          <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={loadLeaderboard} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="ms-leaderboard-panel__placeholder">Loading rankings…</div>
      ) : error ? (
        <div className="ms-leaderboard-panel__placeholder ms-leaderboard-panel__placeholder--error">{error}</div>
      ) : entries.length === 0 ? (
        <div className="ms-leaderboard-panel__placeholder">No rankings yet. Add rows in your Google Sheet.</div>
      ) : (
        <div className="ms-table-wrap ms-table-wrap--leaderboard" style={gridStyle}>
          <div className="ms-table-head ms-table-head--leaderboard">
            {columns.map((col) => (
              <span key={col.key}>{col.label}</span>
            ))}
          </div>
          {entries.map((entry, index) => (
            <div
              className="ms-table-row ms-table-row--leaderboard"
              key={`${index}-${columns.map((c) => entry[c.key]).join('|')}`}
            >
              {columns.map((col) => {
                const k = col.key.toLowerCase();
                const cellClass =
                  k === 'rank'
                    ? 'ms-lb-cell--rank'
                    : k === 'mark' || k === 'score' || k === 'points'
                      ? 'ms-lb-cell--score'
                      : undefined;
                return (
                  <span key={col.key} className={cellClass}>
                    {entry[col.key] ?? ''}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
