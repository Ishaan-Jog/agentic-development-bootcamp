import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ems_token') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginAs = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.login(email, password);
      const newToken = res.data.token;
      const newUser = res.data.user;
      localStorage.setItem('ems_token', newToken);
      setToken(newToken);
      setUser(newUser);
      showToast(`Switched account to ${newUser.name} (${newUser.role})`, 'success');
      return newUser;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    if (targetRole === 'HEAD_USER') {
      await loginAs('head@ems.com', 'Password123!');
    } else if (targetRole === 'VIEWER') {
      await loginAs('viewer@ems.com', 'Password123!');
    }
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    setToken(null);
    setUser(null);
    showToast('Logged out of session', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginAs, switchRole, logout, toast, showToast }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
