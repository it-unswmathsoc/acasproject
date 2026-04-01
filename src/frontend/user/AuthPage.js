import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthPage({ onBack }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    if (tab === 'login') {
      const res = login(form.username, form.password);
      if (res.error) setError(res.error);
    } else {
      if (!form.username || !form.email || !form.password) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const res = register(form);
      if (res.error) setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="ms-auth-wrap">
      <button type="button" className="ms-btn-ghost ms-btn-ghost--sm ms-btn-ghost--nav" onClick={onBack}>← Back</button>
      <div className="ms-glass-card ms-glass-card--narrow">
        <div className="ms-auth-head">
          <span className="ms-overline">UNSW MathSoc</span>
          <h2 className="ms-title-section">{tab === 'login' ? 'Welcome Back' : 'Join the Community'}</h2>
        </div>
        <div className="ms-tabs">
          {['login', 'register'].map(t => (
            <button key={t} type="button" className={`ms-tab ${tab === t ? 'ms-tab--active' : ''}`} onClick={() => { setTab(t); setError(''); }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>
        <div className="ms-form-stack">
          {tab === 'register' && (
            <div>
              <label className="ms-label" htmlFor="auth-display">Display Name</label>
              <input id="auth-display" className="ms-input" placeholder="e.g. Alex Chen" value={form.displayName} onChange={e => set('displayName', e.target.value)} />
            </div>
          )}
          <div>
            <label className="ms-label" htmlFor="auth-user">{tab === 'login' ? 'Username or Email' : 'Username'}</label>
            <input id="auth-user" className="ms-input" placeholder={tab === 'login' ? 'Enter username or email' : 'Choose a username'} value={form.username} onChange={e => set('username', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {tab === 'register' && (
            <div>
              <label className="ms-label" htmlFor="auth-email">Email</label>
              <input id="auth-email" className="ms-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          )}
          <div>
            <label className="ms-label" htmlFor="auth-pass">Password</label>
            <input id="auth-pass" className="ms-input" type="password" placeholder={tab === 'login' ? 'Enter password' : 'Min 6 characters'} value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && <div className="ms-alert-error">{error}</div>}
          <button type="button" className="ms-btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? '…' : tab === 'login' ? 'Sign In' : 'Create Account'}</button>
        </div>
      </div>
    </div>
  );
}
