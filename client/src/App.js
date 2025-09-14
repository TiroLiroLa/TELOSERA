import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import './App.css';
import { useEffect, useState } from 'react'; // Importe useState e useEffect
import axios from 'axios'; // Importe axios
import AnuncioForm from './components/AnuncioForm'; // Importe o novo formulário
import './components/Dashboard.css'; // <<< IMPORTA O NOVO CSS

// Componente para o Painel de Controle (Dashboard)
const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [meusAnuncios, setMeusAnuncios] = useState([]);

    // Função para buscar os anúncios do usuário
    const fetchMeusAnuncios = async () => {
        try {
            const res = await axios.get('/api/anuncios/meus');
            setMeusAnuncios(res.data);
        } catch (err) {
            console.error("Erro ao buscar anúncios", err);
        }
    };

    // useEffect para chamar a função de busca quando o componente montar
    useEffect(() => {
        fetchMeusAnuncios();
    }, []);

    // Função para adicionar o novo anúncio à lista sem precisar recarregar a página
    const handleAnuncioCriado = (novoAnuncio) => {
        setMeusAnuncios([novoAnuncio, ...meusAnuncios]);
    };

    // Função para deletar um anúncio
    const handleDelete = async (idAnuncio) => {
        if (window.confirm('Tem certeza que deseja deletar este anúncio?')) {
            try {
                await axios.delete(`/api/anuncios/${idAnuncio}`);
                // Filtra a lista, removendo o anúncio que foi deletado
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