import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Hook para pegar o ID da URL
import axios from 'axios';
import './AnuncioDetalhe.css'; // Vamos criar este CSS

const AnuncioDetalhe = () => {
  const { id } = useParams(); // Pega o ':id' da rota /anuncio/:id
  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/anuncios/${id}`);
        setAnuncio(res.data);
      } catch (err) {
        setError('Anúncio não encontrado ou indisponível.');
        console.error("Erro ao buscar detalhes do anúncio:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncio();
  }, [id]); // O useEffect será executado novamente se o ID na URL mudar

  if (loading) {
    return <div className="container">Carregando...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  if (!anuncio) {
    return null; // ou alguma mensagem de 'nada para mostrar'
  }

  return (
    <div className="anuncio-detalhe-container">
      <div className="anuncio-main-content">
        <h1>{anuncio.titulo}</h1>
        <div className="image-gallery-placeholder">
          {/* Placeholder para múltiplas imagens, como na Figura 11 */}
          <div className="placeholder-box">IMAGEM</div>
          <div className="placeholder-box">IMAGEM</div>
          <div className="placeholder-box">IMAGEM</div>
        </div>
        <h2>Detalhes</h2>
        <p>{anuncio.descricao}</p>
        <ul>
            <li><strong>Tipo de Anúncio:</strong> {anuncio.tipo === 'O' ? 'Oferta de Vaga' : 'Oferta de Serviço'}</li>
            <li><strong>Área de Atuação:</strong> {anuncio.nome_area}</li>
            <li><strong>Serviço Relacionado:</strong> {anuncio.nome_servico}</li>
        </ul>
      </div>
      <aside className="anuncio-sidebar">
        <div className="info-box">
          <h3>Informações do {anuncio.tipo === 'O' ? 'Contratante' : 'Prestador'}</h3>
          <p><strong>Nome:</strong> {anuncio.nome_usuario}</p>
          {/* Futuramente, o acesso ao contato pode ser restrito a usuários logados */}
          <h4>Contato</h4>
          <p><strong>Email:</strong> {anuncio.email_usuario}</p>
          <p><strong>Telefone:</strong> {anuncio.telefone_usuario || 'Não informado'}</p>
          <button className="profile-button">Acessar Perfil</button>
        </div>
        <div className="info-box">
          <h3>Avaliação</h3>
          <div className="stars-placeholder">????? (4.5)</div>
        </div>
      </aside>
    </div>
  );
};

export default AnuncioDetalhe;