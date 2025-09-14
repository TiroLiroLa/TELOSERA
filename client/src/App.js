import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Links de navegação simples para teste */}
        <nav>
          <Link to="/login">Login</Link> | <Link to="/cadastro">Cadastro</Link>
        </nav>
        
        {/* O componente Routes define a área onde as páginas serão renderizadas */}
        <Routes>
          {/* Cada Route mapeia um caminho (URL) para um componente */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          {/* Adicione uma rota padrão para a página inicial, se desejar */}
          <Route path="/" element={<h1>Bem-vindo ao TELOSERA</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;