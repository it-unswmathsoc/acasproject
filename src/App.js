import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PublicFeed from './pages/PublicFeed';
import DirectorDashboard from './pages/DirectorDashboard';
import './App.css';

function AppRouter() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    if (user) {
      setCurrentPage(user.role === 'director' ? 'director' : 'feed');
    }
  }, [user]);

  if (!user) {
    if (currentPage === 'auth') return <AuthPage onBack={() => setCurrentPage('landing')} />;
    return <LandingPage onEnter={() => setCurrentPage('auth')} />;
  }

  if (user.role === 'director') {
    return <DirectorDashboard onLogout={() => setCurrentPage('landing')} />;
  }

  return <PublicFeed onLogout={() => setCurrentPage('landing')} />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppRouter />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
