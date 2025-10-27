import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './components/Styles.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AnuncioDetalhe from './pages/AnuncioDetalhe';
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import CriarAnuncio from './pages/CriarAnuncio';
import GerenciarAnuncio from './pages/GerenciarAnuncio';
import Header from './components/Header';
import Busca from './pages/Busca';
import VerificationSuccess from './pages/VerificationSuccess';
import VerificationFailure from './pages/VerificationFailure';
import Verification from './pages/Verification';

const AppContent = () => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (



        <Router>
            <div className="App">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/anuncio/:id" element={<AnuncioDetalhe />} />
                        <Route path="/anuncios/criar" element={isAuthenticated ? <CriarAnuncio /> : <Navigate to="/login" />} />
                        <Route path="/anuncios/gerenciar/:id" element={isAuthenticated ? <GerenciarAnuncio /> : <Navigate to="/login" />} />
                        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                        <Route path="/cadastro" element={!isAuthenticated ? <Cadastro /> : <Navigate to="/dashboard" />} />
                        <Route path="/busca" element={<Busca />} />
                        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/perfil/:id" element={<Perfil />} />
                        <Route path="/perfil/editar" element={isAuthenticated ? <EditarPerfil /> : <Navigate to="/login" />} />
                        <Route path="/verify/:token" element={<Verification />} />
                        <Route path="/verification-success" element={<VerificationSuccess />} />
                        <Route path="/verification-failure" element={<VerificationFailure />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;