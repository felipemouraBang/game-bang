import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Checking session...');
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        console.log('Session check status:', res.status);
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        console.log('User session data:', data.user);
        setUser(data.user);
      })
      .catch((err) => {
        console.log('Session check failed:', err.message);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (login, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
