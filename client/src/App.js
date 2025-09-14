import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';
import { useEffect, useState } from 'react'; // Importe useState e useEffect
import axios from 'axios'; // Importe axios
import AnuncioForm from './components/AnuncioForm'; // Importe o novo formul�rio
import './components/Dashboard.css'; // <<< IMPORTA O NOVO CSS
import Home from './pages/Home'; // <<< IMPORTA A NOVA P�GINA HOME
import AnuncioDetalhe from './pages/AnuncioDetalhe'; // <<< Importa o novo componente

// Componente para o Painel de Controle (Dashboard)
const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [meusAnuncios, setMeusAnuncios] = useState([]);

    // Fun��o para buscar os an�ncios do usu�rio
    const fetchMeusAnuncios = async () => {
        try {
            const res = await axios.get('/api/anuncios/meus');
            setMeusAnuncios(res.data);
        } catch (err) {
            console.error("Erro ao buscar anúncios", err);
        }
    };

    // useEffect para chamar a fun��o de busca quando o componente montar
    useEffect(() => {
        fetchMeusAnuncios();
    }, []);

    // Fun��o para adicionar o novo an�ncio � lista sem precisar recarregar a p�gina
    const handleAnuncioCriado = (novoAnuncio) => {
        setMeusAnuncios([novoAnuncio, ...meusAnuncios]);
    };

    // Fun��o para deletar um an�ncio
    const handleDelete = async (idAnuncio) => {
        if (window.confirm('Tem certeza que deseja deletar este anúncio?')) {
            try {
                await axios.delete(`/api/anuncios/${idAnuncio}`);
                // Filtra a lista, removendo o an�ncio que foi deletado
                setMeusAnuncios(meusAnuncios.filter(anuncio => anuncio.id_anuncio !== idAnuncio));
                alert('Anúncio deletado com sucesso.');
            } catch (err) {
                console.error(err.response.data);
                alert('Erro ao deletar o anúncio.');
            }
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Painel de Controle</h1>
                <span>Olá, {user?.nome}!</span>
                <button onClick={logout}>Sair</button>
            </div>
            
            <AnuncioForm onAnuncioCriado={handleAnuncioCriado} />
            
            <div className="anuncios-section">
                <h2>Meus Anúncios Publicados</h2>
                {meusAnuncios.length > 0 ? (
                    <ul className="anuncios-lista">
                        {meusAnuncios.map(anuncio => (
                            <li key={anuncio.id_anuncio} className="anuncio-item">
                                <h3>{anuncio.titulo}</h3>
                                <p>{anuncio.descricao}</p>
                                <button onClick={() => handleDelete(anuncio.id_anuncio)}>Deletar</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Você ainda não publicou nenhum anúncio.</p>
                )}
            </div>
        </div>
    );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Router>
      <div className="App">
        {/* Barra de Navega��o Gen�rica - Poderia ser um componente separado */}
        <header className="main-header">
            <Link to="/" className="logo">TELOSERA</Link>
            <nav>
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard">Meu Painel</Link>
                        {/* O bot�o de Sair agora est� s� no dashboard, mas poderia estar aqui */}
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/cadastro">Cadastre-se</Link>
                    </>
                )}
            </nav>
        </header>

        {/* Conte�do da p�gina */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} /> {/* <<< ROTA DA P�GINA INICIAL */}
            <Route path="/anuncio/:id" element={<AnuncioDetalhe />} /> {/* <<< NOVA ROTA DIN�MICA */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/cadastro" element={!isAuthenticated ? <Cadastro /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            {/* Rota de fallback, se nenhuma outra corresponder */}
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