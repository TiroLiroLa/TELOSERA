import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard';
import './Home.css';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [tituloOfertas, setTituloOfertas] = useState("Últimas ofertas de trabalho");

  useEffect(() => {
    const fetchAnuncios = async () => {
      setLoading(true);
      let params = new URLSearchParams();

      if (isAuthenticated) {
        try {
          const resRegiao = await axios.get('/api/users/me/regiao');
          const { lat, lng } = resRegiao.data;

          params.append('lat', lat);
          params.append('lng', lng);
          params.append('sortBy', 'distance');
          setTituloOfertas("Ofertas de trabalho perto de você");
        } catch (error) {
          console.log("Usuário não possui região de atuação definida.");
          setTituloOfertas("Últimas ofertas de trabalho");
        }
      }

      try {
        const resAnuncios = await axios.get(`/api/anuncios?${params.toString()}`);
        setAnuncios(resAnuncios.data);
      } catch (err) {
        console.error("Erro ao buscar anúncios públicos:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAnuncios();
    }
  }, [isAuthenticated, authLoading]);

  const ofertasTrabalho = anuncios.filter(anuncio => anuncio.tipo === 'O');
  const profissionaisDisponiveis = anuncios.filter(anuncio => anuncio.tipo === 'S');

  if (loading) return <div>Carregando anúncios...</div>;

  return (
    <div className="home-container">
      <section className="anuncios-section">
        <h2>{tituloOfertas}</h2>
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