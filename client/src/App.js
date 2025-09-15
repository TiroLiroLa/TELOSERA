import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';
import { useEffect, useState } from 'react'; // Importe useState e useEffect
import axios from 'axios'; // Importe axios
import './components/Styles.css'; // <<< IMPORTA O NOVO CSS
import Home from './pages/Home'; // <<< IMPORTA A NOVA P�GINA HOME
import Dashboard from './pages/Dashboard'; // <<< 1. IMPORTA o novo componente Dashboard
import AnuncioDetalhe from './pages/AnuncioDetalhe'; // <<< Importa o novo componente
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import CriarAnuncio from './pages/CriarAnuncio'; // <<< Importar a nova página
import GerenciarAnuncio from './pages/GerenciarAnuncio';
import Header from './components/Header';

const AppContent = () => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Carregando...</div>;
    }
    
    return (

         

        <Router>
            <div className="App">
                <Header /> {/* <<< Usa o componente Header reutilizável */}
                <main>
                    {/* A lógica de proteção de rotas aqui dentro permanece a mesma.
                        Ela é a responsável por redirecionar o usuário. */}
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/anuncio/:id" element={<AnuncioDetalhe />} />
                        <Route path="/anuncios/criar" element={isAuthenticated ? <CriarAnuncio /> : <Navigate to="/login" />} />
                        <Route path="/anuncios/gerenciar/:id" element={isAuthenticated ? <GerenciarAnuncio /> : <Navigate to="/login" />} />
                        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                        <Route path="/cadastro" element={!isAuthenticated ? <Cadastro /> : <Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/perfil/:id" element={<Perfil />} />
                        <Route path="/perfil/editar" element={isAuthenticated ? <EditarPerfil /> : <Navigate to="/login" />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
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