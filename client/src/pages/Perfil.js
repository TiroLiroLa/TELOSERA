import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StaticMap from '../components/StaticMap'; // <<< 1. Importar o novo componente
import '../components/Styles.css'; // Importe seu arquivo CSS
import './Perfil.css'; // Importa o novo CSS
import { AuthContext } from '../context/AuthContext'; // Para saber se somos o dono do perfil

const Perfil = () => {
  const { id } = useParams(); // Pega o ID da URL
  const { user, isAuthenticated, logout } = useContext(AuthContext); 
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/users/${id}`);
        setPerfil(res.data);
      } catch (err) {
        console.error("Erro ao buscar perfil", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [id]);

  const handleLogout = () => {
    logout(); // Limpa o estado de autenticação
    navigate('/'); // Redireciona o usuário para a página inicial
  };

  if (loading) return <div className="container">Carregando perfil...</div>;
  if (!perfil) return <div className="container">Perfil não encontrado.</div>;

  // Verifica se o usuário logado é o dono deste perfil
  const isOwner = isAuthenticated && user?.id_usuario === perfil.id_usuario;
  const dataCadastro = new Date(perfil.data_cadastro).toLocaleDateString('pt-BR');

   return (
    <div className="perfil-container">
      <aside className="perfil-sidebar">
        <div className="perfil-avatar-large">
          {perfil.nome.charAt(0).toUpperCase()}
        </div>
        <h2>{perfil.nome}</h2>
        <p className="membro-desde">Membro desde {dataCadastro}</p>
        
        {/* Botão de Editar só aparece para o dono */}
        {isOwner && (
          <div className="owner-actions"> {/* Contêiner para os botões */}
            <Link to="/perfil/editar" className="btn-secondary2 edit-profile-btn">
                Editar Perfil
            </Link>
            {/* <<< 4. Adicionar o botão de Sair */}
            <button onClick={handleLogout} className="btn-secondary logout-btn">
                Sair
            </button>
          </div>
        )}
      </aside>

      <main className="perfil-main-content">
        <section className="perfil-section">
          <h3>Informações</h3>
          <p><strong>Tipo:</strong> {perfil.tipo_usuario === 'P' ? 'Prestador de Serviço' : 'Empresa'}</p>
          <p><strong>Telefone:</strong> {perfil.telefone || "Não informado"}</p>
          <p><strong>Localização Principal:</strong> {perfil.cidade ? `${perfil.cidade}, ${perfil.estado}` : 'Não informada'}</p>
        </section>

        {perfil.especialidades && perfil.especialidades.length > 0 && (
          <section className="perfil-section">
            <h3>Especialidades</h3>
            <ul className="especialidades-list">
              {perfil.especialidades.map(area => (
                <li key={area.id_area}>{area.nome}</li>
              ))}
            </ul>
          </section>
        )}

        {perfil.localizacao && perfil.raio && (
          <section className="perfil-section">
            <h3>Região de Atuação</h3>
            <p>Atende em um raio de <strong>{perfil.raio} km</strong> a partir do ponto central abaixo.</p>
            <div style={{ maxWidth: '500px', margin: '1rem 0' }}>
              <StaticMap location={perfil.localizacao} raio={perfil.raio} />
            </div>
          </section>
        )}

        {perfil.anuncios && perfil.anuncios.length > 0 && (
          <section className="perfil-section">
            <h3>Últimos Anúncios</h3>
            <div className="anuncios-perfil-lista">
              {perfil.anuncios.map(anuncio => (
                <div key={anuncio.id_anuncio} className="anuncio-item">
                  <Link to={`/anuncio/${anuncio.id_anuncio}`}><strong>{anuncio.titulo}</strong></Link>
                  <p>{anuncio.descricao.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Perfil;