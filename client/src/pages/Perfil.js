import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StaticMap from '../components/StaticMap'; // <<< 1. Importar o novo componente
import '../components/Styles.css'; // Importe seu arquivo CSS

const Perfil = () => {
  const { id } = useParams(); // Pega o ID da URL
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
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

  if (loading) return <div>Carregando perfil...</div>;
  if (!perfil) return <div>Perfil não encontrado.</div>;
  
  // Formata a data de cadastro para um formato legível
  const dataCadastro = new Date(perfil.data_cadastro).toLocaleDateString('pt-BR');

  return (
    <div className="container">
      <h1>Perfil de {perfil.nome}</h1>
      <p>
        <strong>Tipo de Conta:</strong> {perfil.tipo_usuario === 'P' ? 'Prestador de Serviço' : 'Empresa'}
      </p>
      <p>
        <strong>Localização:</strong> {perfil.cidade ? `${perfil.cidade}, ${perfil.estado}` : 'Não informada'}
      </p>
      <p>
        <strong>Membro desde:</strong> {dataCadastro}
      </p>
      {/* <<< 2. Nova seção para o mapa e a região de atuação */}
      {perfil.localizacao && perfil.raio && (
        <div className="perfil-regiao" style={{ marginTop: '2rem' }}>
          <h4>Região de Atuação</h4>
          <p>Atende em um raio de <strong>{perfil.raio} km</strong> a partir da cidade: {perfil.cidade}, {perfil.estado}.</p>
          
          {/* <<< Contêiner para controlar o tamanho do mapa */}
          <div style={{ maxWidth: '500px', margin: '1rem auto' }}> 
            <StaticMap location={perfil.localizacao} raio={perfil.raio} />
          </div>

        </div>
      )}
      {/* Aqui viriam outras seções, como anúncios do usuário, avaliações, etc. */}
      <Link to="/" className="link-sem-sublinhado">Voltar para a página inicial </Link>
    </div>
  );
};

export default Perfil;