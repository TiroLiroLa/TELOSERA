import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Links de navega��o simples para teste */}
        <nav>
          <Link to="/login">Login</Link> | <Link to="/cadastro">Cadastro</Link>
        </nav>
        
        {/* O componente Routes define a �rea onde as p�ginas ser�o renderizadas */}
        <Routes>
          {/* Cada Route mapeia um caminho (URL) para um componente */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          {/* Adicione uma rota padr�o para a p�gina inicial, se desejar */}
          <Route path="/" element={<h1>Bem-vindo ao TELOSERA</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;