import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      api.defaults.headers.common['x-auth-token'] = localToken;
      try {
        const res = await api.get('/api/users/me');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, senha) => {
        const body = JSON.stringify({ email, senha });
        const config = { headers: { 'Content-Type': 'application/json' } };
        try {
            const res = await api.post('/api/users/login', body, config);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            await loadUser();
        } catch (err) {
            localStorage.removeItem('token');
            throw err.response.data;
        }
    };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};