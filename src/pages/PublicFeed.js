import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

function TimeRemaining({ deadline }) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return <span style={{ color: '#ff8a8a', fontSize: '12px', fontFamily: 'var(--ms-font-ui)' }}>Closed</span>;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return (
      <span style={{ color: '#8fd4b0', fontSize: '12px', fontFamily: 'var(--ms-font-ui)' }}>
        {days}d {hours}h remaining
      </span>
    );
  }
  return (
    <span style={{ color: '#f0c85c', fontSize: '12px', fontFamily: 'var(--ms-font-ui)' }}>
      {hours}h {mins}m remaining
    </span>
  );
}

const TYPE_CONFIG = {
  puzzle: { label: 'Puzzle', color: '#8fd4f0', bg: 'rgba(126,200,227,0.12)', border: 'rgba(143,212,240,0.4)', icon: '' },
  fact: { label: 'Math Fact', color: '#c4b0f0', bg: 'rgba(184,160,232,0.12)', border: 'rgba(196,176,240,0.4)', icon: '' },
  challenge: { label: 'Challenge', color: '#e8c547', bg: 'rgba(212,175,55,0.14)', border: 'rgba(212,175,55,0.45)', icon: '' },
};

function PostCard({ post, userId, username }) {
  const { submitAnswer, getUserSubmission } = useData();
  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [answer, setAnswer] = useState('');

  const existingSub = getUserSubmission(post.id, userId);
  const typeConfig = TYPE_CONFIG[post.type] || TYPE_CONFIG.puzzle;
  const isActive = !post.deadline || new Date(post.deadline) > new Date();

  const handleSubmit = () => {
    if (!answer.trim()) return;
    submitAnswer(post.id, { userId, answer: answer.trim(), username });
    setShowSubmit(false);
  };

  return (
    <div className="ms-post-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            className="ms-type-pill"
            style={{
              background: typeConfig.bg,
              color: typeConfig.color,
              borderColor: typeConfig.border,
            }}
          >
            {typeConfig.icon ? `${typeConfig.icon} ` : ''}{typeConfig.label}
          </span>
          {post.tags?.map(tag => (
            <span key={tag} style={{ color: 'var(--ms-muted-3)', fontSize: '11px', fontFamily: 'var(--ms-font-ui)' }}>
              #{tag}
            </span>
          ))}
        </div>
        {post.deadline && <TimeRemaining deadline={post.deadline} />}
      </div>

      <h3 className="ms-post-card__title">{post.title}</h3>

      <p
        className="ms-post-card__body"
        style={{
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        {post.content}
      </p>

      {post.content.length > 200 && (
        <button type="button" className="ms-link-quiet" onClick={() => setExpanded(!expanded)}>
          {expanded ? '↑ Show less' : '↓ Read more'}
        </button>
      )}

      {expanded && post.hint && (
        <div className="ms-hint-block">Hint: {post.hint}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="ms-post-card__meta">
          Posted by {post.authorName} ·{' '}
          {new Date(post.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        {post.type !== 'fact' && (
          <div>
            {existingSub ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8fd4b0', fontSize: '12px', fontFamily: 'var(--ms-font-ui)' }}>
                <span>Answer submitted</span>
                <button
                  type="button"
                  className="ms-btn-ghost ms-btn-ghost--sm"
                  style={{ padding: '4px 10px', fontSize: '10px', letterSpacing: '0.08em', borderColor: 'rgba(126,207,160,0.28)', color: 'rgba(126,207,160,0.75)' }}
                  onClick={() => { setShowSubmit(true); setAnswer(existingSub?.answer || ''); }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmit(!showSubmit)}
                disabled={!isActive}
                className="ms-btn-ghost ms-btn-ghost--sm"
                style={{
                  background: isActive ? 'rgba(212,175,55,0.08)' : 'rgba(80,80,90,0.15)',
                  borderColor: isActive ? 'rgba(212,175,55,0.35)' : 'rgba(120,120,130,0.25)',
                  color: isActive ? 'var(--ms-gold)' : 'var(--ms-muted-3)',
                  cursor: isActive ? 'pointer' : 'not-allowed',
                }}
              >
                {isActive ? 'Submit Answer' : 'Closed'}
              </button>
            )}
          </div>
        )}
      </div>

      {showSubmit && (
        <div className="ms-submit-panel">
          <label className="ms-label" htmlFor={`ans-${post.id}`}>Your Answer</label>
          <textarea
            id={`ans-${post.id}`}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={4}
            placeholder="Type your solution or reasoning here..."
            className="ms-textarea"
          />
          <div className="ms-row-actions">
            <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={() => setShowSubmit(false)}>
              Cancel
            </button>
            <button type="button" className="ms-btn-secondary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicFeed({ onLogout }) {
  const { user, logout } = useAuth();
  const { posts } = useData();
  const [filter, setFilter] = useState('all');

  const handleLogout = () => { logout(); onLogout(); };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="ms-page">
      <nav className="ms-nav">
        <div className="ms-nav__brand">
          <span className="ms-nav__title">MathSoc</span>
          <span className="ms-nav__badge">Academics</span>
        </div>
        <div className="ms-nav__actions">
          <span className="ms-nav__user">
            Hello, <span>{user.displayName}</span>
          </span>
          <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="ms-hero">
        <div className="ms-overline">Weekly Content</div>
        <h1 className="ms-hero__title">Math Puzzles & Challenges</h1>
        <p className="ms-hero__sub">Explore, think deeply, and submit your answers</p>
      </div>

      <div className="ms-filter-row">
        {['all', 'puzzle', 'challenge', 'fact'].map(f => (
          <button
            key={f}
            type="button"
            className={`ms-chip ${filter === f ? 'ms-chip--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'puzzle' ? 'Puzzles' : f === 'challenge' ? 'Challenges' : 'Facts'}
          </button>
        ))}
      </div>

      <div className="ms-feed-main">
        {filtered.length === 0 ? (
          <div className="ms-empty">No posts yet. Check back soon!</div>
        ) : (
          filtered.map(post => <PostCard key={post.id} post={post} userId={user.id} username={user.displayName} />)
        )}
      </div>
    </div>
  );
}
