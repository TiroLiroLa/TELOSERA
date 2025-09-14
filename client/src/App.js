import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';

// Componente para o Painel de Controle (Dashboard)
const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <div>
            <h1>Bem-vindo ao Painel, {user?.nome}!</h1>
            <p>Seu e-mail: {user?.email}</p>
            <button onClick={logout}>Sair</button>
        </div>
    );
};

// Componente que renderiza a aplicação
const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Router>
      <div className="App">
        <nav>
            {isAuthenticated ? (
                <Link to="/dashboard">Painel</Link>
            ) : (
                <>
                    <Link to="/login">Login</Link> | <Link to="/cadastro">Cadastro</Link>
                </>
            )}
        </nav>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/cadastro" element={!isAuthenticated ? <Cadastro /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
};

// Componente principal que usa o Provedor
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;