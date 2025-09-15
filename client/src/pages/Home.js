import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard';
import './Home.css'; // Vamos criar este arquivo de CSS

const Home = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await axios.get('/api/anuncios');
        setAnuncios(res.data);
      } catch (err) {
        console.error("Erro ao buscar anúncios públicos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncios();
  }, []);

  // Filtra os anúncios pelos tipos definidos no seu banco ('O' e 'S')
  const ofertasTrabalho = anuncios.filter(anuncio => anuncio.tipo === 'O');
  const profissionaisDisponiveis = anuncios.filter(anuncio => anuncio.tipo === 'S');

  if (loading) {
    return <div>Carregando anúncios...</div>;
  }

  return (
    <div className="home-container">
      <section className="anuncios-section">
        <h2>Ofertas de trabalho na região</h2>
        <div className="cards-container">
          {ofertasTrabalho.length > 0 ? (
            ofertasTrabalho.map(anuncio => <AnuncioCard key={anuncio.id_anuncio} anuncio={anuncio} />)
          ) : (
            <p>Nenhuma oferta de trabalho encontrada no momento.</p>
          )}
        </div>
      </section>

      <section className="anuncios-section">
        <h2>Profissionais dispoíveis na região</h2>
        <div className="cards-container">
          {profissionaisDisponiveis.length > 0 ? (
            profissionaisDisponiveis.map(anuncio => <AnuncioCard key={anuncio.id_anuncio} anuncio={anuncio} />)
          ) : (
            <p>Nenhum profissional disponível encontrado no momento.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;