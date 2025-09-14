import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Cria o Contexto
export const AuthContext = createContext(null);

// Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função para carregar os dados do usuário se um token existir
  const loadUser = async () => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      // Define o token no header padrão do axios para todas as requisições
      axios.defaults.headers.common['x-auth-token'] = localToken;
      try {
        const res = await axios.get('/api/users/me'); // Chama a rota protegida que criamos
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        // Se o token for inválido, remove
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };
  
  // useEffect para rodar loadUser() uma vez quando o app carregar
  useEffect(() => {
    loadUser();
  }, []);

  // Função de Login
  const login = async (email, senha) => {
    const body = JSON.stringify({ email, senha });
    const config = { headers: { 'Content-Type': 'application/json' } };
    try {
      const res = await axios.post('/api/users/login', body, config);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      await loadUser(); // Carrega os dados do usuário após o login
      return true; // Sucesso
    } catch (err) {
      localStorage.removeItem('token');
      return false; // Falha
    }
  };

  // Função de Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};