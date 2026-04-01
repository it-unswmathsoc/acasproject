import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const REMOVED_USERNAMES = new Set(['acad_director']);

const DEFAULT_USERS = [
  { id: '1', username: 'Jenny Weng', email: 'academics@mathsoc.com', password: 'mathsocrox', role: 'director', displayName: 'Jenny Weng', createdAt: new Date().toISOString() },
  { id: '2', username: 'Jimmy Sun', email: 'academics@mathsoc.com', password: 'mathsocrox', role: 'director', displayName: 'Academics Director', createdAt: new Date().toISOString() },
  { id: '3', username: 'Thomas Liao', email: 'academics@mathsoc.com', password: 'mathsocrox', role: 'director', displayName: 'Academics Director', createdAt: new Date().toISOString() },
  { id: '4', username: 'directortest', email: 'academics@mathsoc.com', password: 'mathsocrox', role: 'director', displayName: 'Academics Director', createdAt: new Date().toISOString() }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem('mathsoc_users');
    if (!stored) return DEFAULT_USERS;
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return DEFAULT_USERS;
      const filtered = parsed.filter(u => !REMOVED_USERNAMES.has(String(u?.username || '').toLowerCase())).map(u => ({ ...u, displayName: u.username }));
      const byUsername = new Map(filtered.map(u => [String(u.username || '').toLowerCase(), u]));
      for (const seed of DEFAULT_USERS) {
        const key = String(seed.username || '').toLowerCase();
        if (!byUsername.has(key)) byUsername.set(key, seed);
      }
      return Array.from(byUsername.values());
    } catch {
      return DEFAULT_USERS;
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('mathsoc_current_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('mathsoc_users', JSON.stringify(users));
  }, [users]);

  const login = (identifier, password) => {
    const normalizedId = String(identifier || '').trim().toLowerCase();
    const normalizedPass = String(password || '').trim();
    const found = users.find(
      u => (String(u.username || '').toLowerCase() === normalizedId || String(u.email || '').toLowerCase() === normalizedId) && String(u.password || '') === normalizedPass
    );
    if (!found) return { error: 'Invalid credentials' };
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('mathsoc_current_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  };

  const register = ({ username, email, password }) => {
    if (users.find(u => u.username === username)) return { error: 'Username already taken' };
    if (users.find(u => u.email === email)) return { error: 'Email already registered' };
    const newUser = { id: Date.now().toString(), username, email, password, role: 'member', displayName: username, createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    localStorage.setItem('mathsoc_current_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mathsoc_current_user');
  };

  return <AuthContext.Provider value={{ user, login, register, logout, users }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
