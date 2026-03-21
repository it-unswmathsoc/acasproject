import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

function PostForm({ onClose, editPost }) {
  const { user } = useAuth();
  const { createPost, updatePost } = useData();
  const [form, setForm] = useState(editPost ? {
    type: editPost.type,
    title: editPost.title,
    content: editPost.content,
    hint: editPost.hint || '',
    deadline: editPost.deadline ? editPost.deadline.slice(0, 16) : '',
    tags: editPost.tags?.join(', ') || '',
  } : {
    type: 'puzzle',
    title: '',
    content: '',
    hint: '',
    deadline: '',
    tags: '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }
    const data = {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim(),
      hint: form.hint.trim() || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      authorId: user.id,
      authorName: user.displayName,
    };
    if (editPost) updatePost(editPost.id, data);
    else createPost(data);
    onClose();
  };

  return (
    <div className="ms-modal-backdrop">
      <div className="ms-modal" role="dialog" aria-labelledby="post-form-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 id="post-form-title" className="ms-title-section" style={{ fontSize: '22px' }}>
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button type="button" className="ms-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="ms-form-stack" style={{ gap: '18px' }}>
          <div>
            <span className="ms-label">Post Type</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['puzzle', 'challenge', 'fact'].map(t => (
                <button
                  key={t}
                  type="button"
                  className="ms-chip"
                  style={{
                    flex: 1,
                    borderRadius: 'var(--ms-radius-sm)',
                    background: form.type === t ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.03)',
                    borderColor: form.type === t ? 'rgba(212,175,55,0.45)' : 'var(--ms-border-subtle)',
                    color: form.type === t ? 'var(--ms-gold)' : 'var(--ms-muted-2)',
                  }}
                  onClick={() => set('type', t)}
                >
                  {t === 'puzzle' ? '🧩 Puzzle' : t === 'challenge' ? '🏆 Challenge' : '💡 Fact'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="ms-label" htmlFor="pf-title">Title</label>
            <input id="pf-title" className="ms-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter a compelling title..." />
          </div>

          <div>
            <label className="ms-label" htmlFor="pf-content">Content</label>
            <textarea
              id="pf-content"
              value={form.content}
              onChange={e => set('content', e.target.value)}
              rows={5}
              placeholder="Write your puzzle, challenge, or math fact..."
              className="ms-textarea"
              style={{ fontFamily: 'var(--ms-font-display)', minHeight: '120px' }}
            />
          </div>

          {form.type !== 'fact' && (
            <div>
              <label className="ms-label" htmlFor="pf-hint">Hint (optional)</label>
              <input id="pf-hint" className="ms-input" value={form.hint} onChange={e => set('hint', e.target.value)} placeholder="Give a nudge without spoiling it..." />
            </div>
          )}

          {form.type !== 'fact' && (
            <div>
              <label className="ms-label" htmlFor="pf-deadline">Submission Deadline (optional)</label>
              <input id="pf-deadline" className="ms-input" type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          )}

          <div>
            <label className="ms-label" htmlFor="pf-tags">Tags (comma-separated)</label>
            <input id="pf-tags" className="ms-input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. number theory, combinatorics" />
          </div>

          {error && <div className="ms-alert-error">{error}</div>}

          <div className="ms-row-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" style={{ padding: '10px 22px' }} onClick={onClose}>Cancel</button>
            <button type="button" className="ms-btn-secondary" style={{ padding: '11px 26px' }} onClick={handleSave}>
              {editPost ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionsModal({ post, onClose }) {
  return (
    <div className="ms-modal-backdrop">
      <div className="ms-modal ms-modal--wide" role="dialog" aria-labelledby="subs-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div className="ms-overline" style={{ marginBottom: '6px', display: 'block' }}>
              {post.submissions.length} Submission{post.submissions.length !== 1 ? 's' : ''}
            </div>
            <h2 id="subs-title" className="ms-title-section" style={{ fontSize: '20px' }}>{post.title}</h2>
          </div>
          <button type="button" className="ms-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {post.submissions.length === 0 ? (
          <div className="ms-empty" style={{ padding: '48px 0' }}>No submissions yet.</div>
        ) : (
          post.submissions.map((sub, i) => (
            <div
              key={sub.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--ms-border-subtle)',
                borderRadius: 'var(--ms-radius-sm)',
                padding: '18px 20px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  className="ms-type-pill"
                  style={{
                    background: 'rgba(212,175,55,0.12)',
                    color: 'var(--ms-gold)',
                    borderColor: 'rgba(212,175,55,0.25)',
                  }}
                >
                  #{i + 1} — {sub.username || `User ${sub.userId}`}
                </span>
                <span style={{ color: 'var(--ms-muted-3)', fontSize: '11px', fontFamily: 'var(--ms-font-ui)' }}>
                  {new Date(sub.submittedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ color: 'var(--ms-muted)', margin: 0, fontSize: '14px', lineHeight: 1.7, fontFamily: 'var(--ms-font-display)' }}>
                {sub.answer}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PostsTab() {
  const { posts, deletePost } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [viewSubs, setViewSubs] = useState(null);

  const TYPE_COLORS = { puzzle: '#8fd4f0', challenge: 'var(--ms-gold)', fact: '#c4b0f0' };

  return (
    <div>
      <div className="ms-dash-row">
        <div>
          <div className="ms-section-label">Manage</div>
          <h2 className="ms-title-section" style={{ fontSize: '28px' }}>All Posts</h2>
        </div>
        <button type="button" className="ms-btn-secondary" style={{ padding: '12px 22px', letterSpacing: '0.2em' }} onClick={() => { setEditPost(null); setShowForm(true); }}>
          + New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="ms-empty">No posts yet. Create your first post!</div>
      ) : posts.map(post => (
        <div key={post.id} className="ms-post-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  color: TYPE_COLORS[post.type] || 'var(--ms-gold)',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--ms-font-ui)',
                  fontWeight: 600,
                }}
              >
                {post.type}
              </span>
              {post.deadline && (
                new Date(post.deadline) > new Date()
                  ? <span style={{ color: '#8fd4b0', fontSize: '11px', fontFamily: 'var(--ms-font-ui)' }}>● Active</span>
                  : <span style={{ color: '#ff8a8a', fontSize: '11px', fontFamily: 'var(--ms-font-ui)' }}>● Closed</span>
              )}
            </div>
            <h3 className="ms-post-card__title" style={{ fontSize: '17px', marginBottom: '6px' }}>{post.title}</h3>
            <p style={{ color: 'var(--ms-muted-2)', fontSize: '13px', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--ms-font-ui)' }}>
              {post.content.slice(0, 90)}{post.content.length > 90 ? '…' : ''}
            </p>
            <span className="ms-post-card__meta">
              {new Date(post.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              {post.submissions.length > 0 && ` · ${post.submissions.length} submission${post.submissions.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {post.type !== 'fact' && (
              <button
                type="button"
                className="ms-btn-ghost ms-btn-ghost--sm"
                style={{ borderColor: 'rgba(126,207,160,0.28)', color: '#8fd4b0', background: 'rgba(126,207,160,0.08)' }}
                onClick={() => setViewSubs(post)}
              >
                {post.submissions.length} Answers
              </button>
            )}
            <button
              type="button"
              className="ms-btn-ghost ms-btn-ghost--sm"
              style={{ borderColor: 'rgba(212,175,55,0.28)', color: 'var(--ms-gold)', background: 'rgba(212,175,55,0.08)' }}
              onClick={() => { setEditPost(post); setShowForm(true); }}
            >
              Edit
            </button>
            <button
              type="button"
              className="ms-btn-ghost ms-btn-ghost--sm"
              style={{ borderColor: 'rgba(220,60,60,0.35)', color: '#ff8a8a', background: 'rgba(220,60,60,0.08)' }}
              onClick={() => { if (window.confirm('Delete this post?')) deletePost(post.id); }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {showForm && <PostForm onClose={() => setShowForm(false)} editPost={editPost} />}
      {viewSubs && <SubmissionsModal post={viewSubs} onClose={() => setViewSubs(null)} />}
    </div>
  );
}

function MembersTab() {
  const { users } = useAuth();
  const { posts } = useData();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div className="ms-section-label">Overview</div>
        <h2 className="ms-title-section" style={{ fontSize: '28px' }}>Registered Members</h2>
      </div>

      <div className="ms-stat-grid">
        {[
          { label: 'Total Members', value: users.filter(u => u.role === 'member').length },
          { label: 'Total Posts', value: posts.length },
          { label: 'Total Submissions', value: posts.reduce((a, p) => a + p.submissions.length, 0) },
        ].map(s => (
          <div key={s.label} className="ms-stat-card">
            <div className="ms-stat-card__value">{s.value}</div>
            <div className="ms-stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="ms-table-wrap">
        <div className="ms-table-head">
          <span>Name</span>
          <span>Username</span>
          <span>Email</span>
          <span>Role</span>
        </div>
        {users.map(u => (
          <div key={u.id} className="ms-table-row">
            <span style={{ color: 'var(--ms-cream-soft)', fontSize: '14px', fontFamily: 'var(--ms-font-ui)' }}>{u.displayName}</span>
            <span style={{ color: 'var(--ms-muted-2)', fontSize: '13px', fontFamily: 'var(--ms-font-ui)' }}>@{u.username}</span>
            <span style={{ color: 'var(--ms-muted-3)', fontSize: '12px', fontFamily: 'var(--ms-font-ui)' }}>{u.email}</span>
            <span
              className="ms-type-pill"
              style={{
                justifySelf: 'end',
                background: u.role === 'director' ? 'rgba(212,175,55,0.14)' : 'rgba(126,207,160,0.1)',
                color: u.role === 'director' ? 'var(--ms-gold)' : '#8fd4b0',
                borderColor: u.role === 'director' ? 'rgba(212,175,55,0.25)' : 'rgba(126,207,160,0.25)',
              }}
            >
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DirectorDashboard({ onLogout }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('posts');

  const handleLogout = () => { logout(); onLogout(); };

  return (
    <div className="ms-page" style={{ display: 'flex', flexDirection: 'column' }}>
      <nav className="ms-nav">
        <div className="ms-nav__brand">
          <span className="ms-nav__title">MathSoc</span>
          <span className="ms-nav__badge--pill">Director</span>
        </div>
        <div className="ms-nav__actions">
          <span className="ms-nav__user" style={{ color: 'var(--ms-muted-2)' }}>{user.displayName}</span>
          <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="ms-dash-tabs">
        {[
          { id: 'posts', label: '📋 Posts & Puzzles' },
          { id: 'members', label: '👥 Members' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`ms-dash-tab ${tab === t.id ? 'ms-dash-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ms-dash-content">
        {tab === 'posts' && <PostsTab />}
        {tab === 'members' && <MembersTab />}
      </div>
    </div>
  );
}
