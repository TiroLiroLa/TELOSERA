import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StaticMap from '../components/StaticMap';
import '../components/Styles.css';
import './Perfil.css';
import { AuthContext } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import { useHelp } from '../context/HelpContext';

const Perfil = () => {
  const { id } = useParams();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setHelpContent } = useHelp();

  useEffect(() => {
    setHelpContent({
      title: 'Ajuda: Perfil de Usuário',
      content: [
        { item: 'Visão Geral', description: 'Esta é a página de perfil público de um usuário. Aqui você pode ver informações como nome, avaliações, especialidades e região de atuação.' },
        { item: 'Ações do Dono', description: 'Se você estiver visualizando seu próprio perfil, verá os botões "Editar Perfil" e "Sair".' },
        { item: 'Região de Atuação', description: 'O mapa mostra a área de cobertura do profissional, baseada em um ponto central e um raio em quilômetros.' },
      ]
    });
  }, [setHelpContent]);

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
    logout();
    navigate('/');
  };

  if (loading) return <div className="container">Carregando perfil...</div>;
  if (!perfil) return <div className="container">Perfil não encontrado.</div>;

  const isOwner = isAuthenticated && user?.id_usuario === perfil.id_usuario;
  const dataCadastro = new Date(perfil.data_cadastro).toLocaleDateString('pt-BR');

  return (
    <div className="perfil-container">
      <aside className="perfil-sidebar">
        <div className="perfil-avatar-large">
          {perfil.nome.charAt(0).toUpperCase()}
        </div>
        <h2>{perfil.nome}</h2>
        {perfil.avaliacao && (
          <div className="perfil-rating">
            <StarRating rating={perfil.avaliacao.media_geral} />
            <span> ({perfil.avaliacao.total_avaliacoes} avaliações)</span>
          </div>
        )}
        <p className="membro-desde">Membro desde {dataCadastro}</p>

        {isOwner && (
          <div className="owner-actions">
            <Link to="/perfil/editar" className="btn-secondary2 edit-profile-btn">
              Editar Perfil
            </Link>
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