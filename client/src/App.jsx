import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BooksPage from './pages/BooksPage';
import MembersPage from './pages/MembersPage';
import IssueReturnPage from './pages/IssueReturnPage';
import FinesPage from './pages/FinesPage';
import StaffPage from './pages/StaffPage';
import DealersPage from './pages/DealersPage';
import SoftwarePage from './pages/SoftwarePage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/books" replace />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/circulation" element={<IssueReturnPage />} />
        <Route path="/fines" element={<FinesPage />} />
        <Route path="/staff" element={user?.designation === 'Admin' ? <StaffPage /> : <Navigate to="/books" replace />} />
        <Route path="/dealers" element={<DealersPage />} />
        <Route path="/software" element={<SoftwarePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage user={user} onUserUpdate={handleUserUpdate} />} />
        <Route path="*" element={<Navigate to="/books" replace />} />
      </Routes>
    </Layout>
  );
}
