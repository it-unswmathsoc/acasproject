import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Seed default accounts
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'acad_director',
    email: 'academics@mathsoc.com',
    password: 'mathsoc2024',
    role: 'director',
    displayName: 'Academics Director',
    createdAt: new Date().toISOString(),
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem('mathsoc_users');
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('mathsoc_current_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('mathsoc_users', JSON.stringify(users));
  }, [users]);

  const login = (identifier, password) => {
    const found = users.find(
      u => (u.username === identifier || u.email === identifier) && u.password === password
    );
    if (!found) return { error: 'Invalid credentials' };
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('mathsoc_current_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  };

  const register = ({ username, email, password, displayName }) => {
    if (users.find(u => u.username === username)) return { error: 'Username already taken' };
    if (users.find(u => u.email === email)) return { error: 'Email already registered' };

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password,
      role: 'member',
      displayName: displayName || username,
      createdAt: new Date().toISOString(),
    };
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, users }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
