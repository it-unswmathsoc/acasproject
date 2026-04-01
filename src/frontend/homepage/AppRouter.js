import { useState, useEffect } from 'react';
import { useAuth } from '../user/AuthContext';
import RegisterPage from '../user/register_page';
import UserPage from '../user/UserPage';
import HomePage from './HomePage';
import DirectorDashboardPage from '../director/DirectorDashboardPage';

export default function AppRouter() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    if (user) setCurrentPage(user.role === 'director' ? 'director' : 'feed');
  }, [user]);

  if (!user) {
    if (currentPage === 'auth') return <RegisterPage onBack={() => setCurrentPage('landing')} />;
    return <HomePage onEnter={() => setCurrentPage('auth')} />;
  }
  if (user.role === 'director') return <DirectorDashboardPage onLogout={() => setCurrentPage('landing')} />;
  return <UserPage onLogout={() => setCurrentPage('landing')} />;
}
