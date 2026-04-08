import { useState } from 'react';
import HomePage from './homepage/HomePage';
import SubmissionPage from './submissionpage/SubmissionPage';
import '../App.css';

export default function AppRouter() {
  const [currentPage, setCurrentPage] = useState('home');

  if (currentPage === 'submit') {
    return <SubmissionPage onBack={() => setCurrentPage('home')} />;
  }
  return <HomePage onEnter={() => setCurrentPage('submit')} />;
}
