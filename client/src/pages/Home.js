import React, { useState, useEffect, useContext } from 'react'; // <<< Importar useContext
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard';
import './Home.css'; // Vamos criar este arquivo de CSS
import { AuthContext } from '../context/AuthContext'; // <<< Importar AuthContext

const Home = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext); // <<< Acessa o contexto
  const [tituloOfertas, setTituloOfertas] = useState("Últimas ofertas de trabalho");

  useEffect(() => {
    const fetchAnuncios = async () => {
      setLoading(true);
      let params = new URLSearchParams();

      // <<< LÓGICA DE PERSONALIZAÇÃO
      if (isAuthenticated) {
        try {
          // Tenta buscar a localização do usuário logado
          const resRegiao = await axios.get('/api/users/me/regiao');
          const { lat, lng } = resRegiao.data;
          
          // Se encontrou, adiciona os parâmetros de busca por distância
          params.append('lat', lat);
          params.append('lng', lng);
          params.append('sortBy', 'distance');
          setTituloOfertas("Ofertas de trabalho perto de você");
        } catch (error) {
          // Se o usuário não tem região cadastrada (erro 404), não faz nada.
          // A busca continuará por data (padrão).
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

    // Espera a autenticação carregar antes de buscar os anúncios
    if (!authLoading) {
        fetchAnuncios();
    }
  }, [isAuthenticated, authLoading]);

  // Filtra os anúncios pelos tipos definidos no seu banco ('O' e 'S')
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