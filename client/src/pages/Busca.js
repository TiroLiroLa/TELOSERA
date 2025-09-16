import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard'; // Reutilizamos o card da Home
import './Busca.css'; // Vamos criar este CSS

const Busca = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para os filtros da sidebar
    const [filtros, setFiltros] = useState({
        q: searchParams.get('q') || '',
        tipo: searchParams.get('tipo') || '',
        area: searchParams.get('area') || '',
        servico: searchParams.get('servico') || ''
    });

    // Estados para popular os dropdowns de filtro
    const [areas, setAreas] = useState([]);
    const [servicos, setServicos] = useState([]);

    const fetchResultados = useCallback(async () => {
        try {
            setLoading(true);
            // Cria a query string a partir do objeto de filtros
            const params = new URLSearchParams(filtros).toString();
            const res = await axios.get(`/api/anuncios?${params}`);
            setResultados(res.data);
        } catch (error) {
            console.error("Erro ao buscar resultados:", error);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        fetchResultados();
        // Atualiza a URL quando os filtros mudam
        setSearchParams(filtros, { replace: true });
    }, [fetchResultados, setSearchParams, filtros]);
    
    // Busca dados para os filtros uma vez
    useEffect(() => {
        const fetchFiltroData = async () => {
            const [resAreas, resServicos] = await Promise.all([
                axios.get('/api/dados/areas'),
                axios.get('/api/dados/servicos')
            ]);
            setAreas(resAreas.data);
            setServicos(resServicos.data);
        };
        fetchFiltroData();
    }, []);

    const handleFiltroChange = (e) => {
        setFiltros(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="busca-page-container">
            <aside className="filtros-sidebar">
                <h2>Filtros</h2>
                <div className="form-group">
                    <label>Palavra-chave</label>
                    <input type="text" name="q" value={filtros.q} onChange={handleFiltroChange} />
                </div>
                <div className="form-group">
                    <label>Tipo de Anúncio</label>
                    <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                        <option value="">Todos</option>
                        <option value="O">Vagas (Empresas)</option>
                        <option value="S">Serviços (Prestadores)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Especialização</label>
                    <select name="area" value={filtros.area} onChange={handleFiltroChange}>
                        <option value="">Todas</option>
                        {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nome}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Serviço Principal</label>
                    <select name="servico" value={filtros.servico} onChange={handleFiltroChange}>
                        <option value="">Todos</option>
                        {servicos.map(s => <option key={s.id_servico} value={s.id_servico}>{s.nome}</option>)}
                    </select>
                </div>
                {/* O filtro de mapa seria um componente mais complexo, adicionado aqui no futuro */}
            </aside>
            <main className="resultados-main">
                <h2>Resultados da Busca ({resultados.length})</h2>
                {loading ? (
                    <p>Buscando...</p>
                ) : (
                    <div className="cards-container">
                        {resultados.length > 0 ? (
                            resultados.map(anuncio => <AnuncioCard key={anuncio.id_anuncio} anuncio={anuncio} />)
                        ) : (
                            <p>Nenhum resultado encontrado para os filtros selecionados.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Busca;