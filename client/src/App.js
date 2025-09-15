import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';
import { useEffect, useState } from 'react'; // Importe useState e useEffect
import axios from 'axios'; // Importe axios
import './components/Dashboard.css'; // <<< IMPORTA O NOVO CSS
import './components/Styles.css'; // <<< IMPORTA O NOVO CSS
import Home from './pages/Home'; // <<< IMPORTA A NOVA P�GINA HOME
import AnuncioDetalhe from './pages/AnuncioDetalhe'; // <<< Importa o novo componente
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import CriarAnuncio from './pages/CriarAnuncio'; // <<< Importar a nova página

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
                <h1>Meu Painel</h1>
                <Link to="/perfil/editar"><button>Editar Perfil</button></Link>
                <button onClick={logout}>Sair</button>
            </div>

            <div className="anuncios-section">
                <h2>Meus Anúncios Publicados</h2>
                {meusAnuncios.length > 0 ? (
                    <ul className="anuncios-lista">
                        {meusAnuncios.map(anuncio => (
                            <Link to={`/anuncio/${anuncio.id_anuncio}`} className='link-sem-sublinhado'>
                                <li key={anuncio.id_anuncio} className="anuncio-item">
                                    <h3>{anuncio.titulo}</h3>
                                    <p>{anuncio.descricao}</p>
                                    <button onClick={() => handleDelete(anuncio.id_anuncio)}>Deletar</button>
                                </li>
                            </Link>
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
                <header className="main-header">
                    <Link to="/" className="logo">TELOSERA</Link>
                    <nav>
                        {/* 1. Link agora está fora da verificação de 'isAuthenticated' */}
                        <Link to="/anuncios/criar">Publicar Anúncio</Link>

                        {isAuthenticated ? (
                            <>
                                {/* O link "Publicar Anúncio" foi removido daqui */}
                                <Link to="/dashboard">Meu Painel</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login">Login</Link>
                                <Link to="/cadastro">Cadastre-se</Link>
                            </>
                        )}
                    </nav>
                </header>
                <main>
                    {/* A lógica de proteção de rotas aqui dentro permanece a mesma.
                        Ela é a responsável por redirecionar o usuário. */}
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/anuncio/:id" element={<AnuncioDetalhe />} />
                        <Route path="/anuncios/criar" element={isAuthenticated ? <CriarAnuncio /> : <Navigate to="/login" />} />
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