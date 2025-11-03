import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard';
import './Home.css';
import { AuthContext } from '../context/AuthContext';
import { useHelp } from '../context/HelpContext';

const Home = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setHelpContent } = useHelp();

  // Estados para os títulos dinâmicos
  const [tituloOfertas, setTituloOfertas] = useState("Últimas ofertas de trabalho");
  const [tituloProfissionais, setTituloProfissionais] = useState("Últimos profissionais disponíveis");

  useEffect(() => {
    setHelpContent({
      title: 'Ajuda: Página Inicial',
      content: [
        { item: 'Feed Principal', description: 'Esta é a sua página inicial. Aqui você vê os anúncios mais recentes, personalizados com base na sua localização e especialidades (se estiver logado).' },
        { item: 'Busca', description: 'Use a barra de busca no topo para encontrar algo específico.' },
        { item: 'Tipos de Anúncio', description: 'Existem "Ofertas de Trabalho" (empresas contratando) e "Profissionais Disponíveis" (prestadores oferecendo serviço).' },
      ]
    });
  }, [setHelpContent]);

  useEffect(() => {
    const fetchAnuncios = async () => {
      setLoading(true);
      const params = new URLSearchParams();

      // --- LÓGICA DE PERSONALIZAÇÃO ---
      if (isAuthenticated) {
        try {
          // Busca em paralelo a região e as especialidades do usuário
          const [resRegiao, resAreas] = await Promise.all([
            axios.get('/api/users/me/regiao').catch(() => null),
            axios.get('/api/users/me/areas').catch(() => null)
          ]);

          // 1. Adiciona filtro de localização
          if (resRegiao && resRegiao.data) {
            const { lat, lng } = resRegiao.data;
            params.append('lat', lat);
            params.append('lng', lng);
            params.append('sortBy', 'distance');
            setTituloOfertas("Ofertas de trabalho perto de você");
            setTituloProfissionais("Profissionais perto de você");
          }

          // 2. Adiciona filtro de especialidades
          if (resAreas && resAreas.data && resAreas.data.length > 0) {
            const areaIds = resAreas.data.map(area => area.id_area);
            // Adiciona cada ID de área como um parâmetro separado
            areaIds.forEach(id => params.append('area', id));

            // Atualiza os títulos para refletir a personalização, se não houver filtro de distância
            if (!params.has('sortBy')) {
              setTituloOfertas("Vagas em suas áreas de interesse");
              setTituloProfissionais("Profissionais em suas áreas de interesse");
            }
          }

        } catch (error) {
          console.log("Usuário sem região ou especialidades definidas. Mostrando feed geral.");
        }
      }

      try {
        // Busca os 8 anúncios mais relevantes (4 de cada tipo, idealmente)
        params.append('limit', '8');
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

  // Filtra os resultados para cada seção, limitando a 4 itens
  const ofertasTrabalho = anuncios.filter(anuncio => anuncio.tipo === 'O').slice(0, 4);
  const profissionaisDisponiveis = anuncios.filter(anuncio => anuncio.tipo === 'S').slice(0, 4);

  if (loading) return <div>Carregando anúncios...</div>;

  return (
    <div className="home-container">
      <section className="anuncios-section">
        <h2>{tituloOfertas}</h2>
        <div className="cards-container">
          {ofertasTrabalho.length > 0 ? (
            ofertasTrabalho.map(anuncio => <AnuncioCard key={anuncio.id_anuncio} anuncio={anuncio} />)
          ) : (
            <p>Nenhuma oferta de trabalho encontrada com base em suas preferências.</p>
          )}
        </div>
      </section>

      <section className="anuncios-section">
        <h2>{tituloProfissionais}</h2>
        <div className="cards-container">
          {profissionaisDisponiveis.length > 0 ? (
            profissionaisDisponiveis.map(anuncio => <AnuncioCard key={anuncio.id_anuncio} anuncio={anuncio} />)
          ) : (
            <p>Nenhum profissional disponível encontrado com base em suas preferências.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;