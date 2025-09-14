// client/src/App.js

import React from 'react';
import Cadastro from './pages/Cadastro'; // Importa nosso novo componente
import './App.css'; // Você pode adicionar estilos aqui depois

function App() {
  return (
    <div className="App">
      <Cadastro /> {/* Renderiza o componente de cadastro */}
    </div>
  );
}

export default App;