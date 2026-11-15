import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = Boolean(token);
  const isAdmin = user?.designation === 'Admin';
  const isLibrarian = user?.designation === 'Librarian';

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isLibrarian,
    login,
    logout
  };
}

