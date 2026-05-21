import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:4000';

export default function LeaderboardTable({ showRefresh = true }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      setEntries(data.entries || []);
    } catch (err) {
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
        <div className="ms-table-wrap ms-table-wrap--leaderboard">
          <div className="ms-table-head ms-table-head--leaderboard">
            <span>Rank</span>
            <span>Name</span>
            <span>Score</span>
          </div>
          {entries.map((entry, index) => (
            <div className="ms-table-row ms-table-row--leaderboard" key={`${entry.rank}-${entry.name}-${index}`}>
              <span>{entry.rank}</span>
              <span>{entry.name}</span>
              <span>{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
