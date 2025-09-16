import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard'; // Reutilizamos o card da Home
import './Busca.css'; // Vamos criar este CSS
import Modal from '../components/Modal'; // <<< 1. Importar Modal
import LocationPicker from '../components/LocationPicker'; // <<< 2. Importar LocationPicker

const Busca = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // <<< 1. A função de inicialização agora lê TODOS os parâmetros da URL
    const inicializarFiltros = () => {
        return {
            q: searchParams.get('q') || '',
            tipo: searchParams.get('tipo') || '',
            area: searchParams.get('area') || '',
            servico: searchParams.get('servico') || '',
            sortBy: searchParams.get('sortBy') || 'relevance',
            lat: searchParams.get('lat') || '',
            lng: searchParams.get('lng') || '',
            raio: searchParams.get('raio') || '',
        };
    };

    const [filtros, setFiltros] = useState(inicializarFiltros);
    const [areas, setAreas] = useState([]);
    const [servicos, setServicos] = useState([]);

    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [tempLocation, setTempLocation] = useState(null); // Posição selecionada no mapa
    const [tempRaio, setTempRaio] = useState(filtros.raio || '20'); // Raio inserido no modal (padrão 20km)

    // <<< 2. 'isGeoSearch' agora é derivado diretamente do estado 'filtros'
    const isGeoSearch = filtros.lat && filtros.lng;

    const fetchResultados = useCallback(async () => {
        try {
            setLoading(true);
            
            // <<< 3. Limpa filtros vazios antes de criar a query string
            const filtrosAtivos = {};
            for (const key in filtros) {
                if (filtros[key]) {
                    filtrosAtivos[key] = filtros[key];
                }
            }
            
            const params = new URLSearchParams(filtrosAtivos).toString();
            const res = await axios.get(`/api/anuncios?${params}`);
            setResultados(res.data);
        } catch (error) {
            console.error("Erro ao buscar resultados:", error);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        // Quando os filtros mudam, busca os resultados e atualiza a URL
        fetchResultados();
        
        // Limpa filtros vazios antes de escrever na URL para deixá-la limpa
        const filtrosAtivos = {};
        for (const key in filtros) {
            if (filtros[key]) {
                filtrosAtivos[key] = filtros[key];
            }
        }
        setSearchParams(filtrosAtivos, { replace: true });

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
        const { name, value } = e.target;
        // Se mudamos para 'Mais Recentes', removemos o sortBy da URL para mantê-la limpa
        if (name === 'sortBy' && value === 'relevance') {
            setFiltros(prev => {
                const newFilters = { ...prev };
                delete newFilters.sortBy;
                return newFilters;
            });
        } else {
            setFiltros(prev => ({...prev, [name]: value }));
        }
    };

    const handleApplyGeoFilter = () => {
        if (tempLocation && tempRaio) {
            setFiltros(prev => ({
                ...prev,
                lat: tempLocation.lat,
                lng: tempLocation.lng,
                raio: tempRaio,
                sortBy: 'distance' // Opcional: define a ordenação por distância como padrão
            }));
            setMapModalOpen(false); // Fecha o modal
        } else {
            alert("Por favor, selecione um local no mapa e defina um raio.");
        }
    };

    const handleClearGeoFilter = () => {
        setFiltros(prev => {
            const newFilters = { ...prev };
            delete newFilters.lat;
            delete newFilters.lng;
            delete newFilters.raio;
            // Se a ordenação era por distância, volta para o padrão
            if (newFilters.sortBy === 'distance') {
                delete newFilters.sortBy;
            }
            return newFilters;
        });
    };

    return (
        <>
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
                <div className="form-group">
                    <label>Localização</label>
                    {isGeoSearch ? (
                        <div className="geo-filter-summary">
                            <span>Busca ativa em um raio de {filtros.raio} km.</span>
                            <button onClick={handleClearGeoFilter} className="clear-btn">Limpar</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setMapModalOpen(true)}>
                            Buscar Perto de Mim
                        </button>
                    )}
                </div>
            </aside>
            <main className="resultados-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Resultados da Busca ({resultados.length})</h2>
                    <div className="form-group">
                        <label style={{ marginRight: '10px' }}>Ordenar por:</label>
                        <select name="sortBy" value={filtros.sortBy} onChange={handleFiltroChange}>
                            <option value="relevance">Mais Recentes</option>
                            {/* <<< A condição agora usa a variável 'isGeoSearch' que vem do estado */}
                            {isGeoSearch && <option value="distance">Menor Distância</option>}
                        </select>
                    </div>
                </div>
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
        <Modal isOpen={isMapModalOpen} onClose={() => setMapModalOpen(false)}>
                <h2>Buscar por Proximidade</h2>
                <p>Clique no mapa para definir um ponto central e ajuste o raio da busca.</p>
                <div style={{height: '300px', marginBottom: '1rem'}}>
                    <LocationPicker onLocationSelect={setTempLocation} initialPosition={tempLocation} radiusKm={tempRaio} />
                </div>
                <div className="form-group">
                    <label>Raio da Busca (em km)</label>
                    <input 
                        type="number" 
                        value={tempRaio}
                        onChange={(e) => setTempRaio(e.target.value)}
                        placeholder="Ex: 20"
                    />
                </div>
                <button type="button" className="btn btn-primary" onClick={handleApplyGeoFilter}>
                    Aplicar Filtro
                </button>
            </Modal>
        </>
    );
};

export default Busca;