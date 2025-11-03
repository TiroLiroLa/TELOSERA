import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AnuncioCard from '../components/AnuncioCard';
import './Busca.css';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import { AuthContext } from '../context/AuthContext';
import { useHelp } from '../context/HelpContext';
import helpIcon from '../assets/help-circle.svg';

const Busca = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
    const { setHelpContent, revertHelpContent, openHelp } = useHelp();

    useEffect(() => {
        setHelpContent({
            title: 'Ajuda: Busca de Anúncios',
            content: [
                { item: 'Filtros', description: 'Use os filtros à esquerda para refinar sua busca por palavra-chave, tipo de anúncio, especialização e serviço.' },
                { item: 'Localização', description: 'Clique em "Buscar Perto de Mim" para encontrar anúncios baseados na sua localização. Se já estiver logado com uma região definida, ela será usada como padrão.' },
                { item: 'Ordenação', description: 'No canto superior direito, você pode ordenar os resultados por relevância (mais recentes), melhores avaliações ou menor distância (se a busca por localização estiver ativa).' },
            ]
        });
    }, [setHelpContent]);

    const getFiltrosFromURL = useCallback(() => {
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
    }, [searchParams]);

    const [filtros, setFiltros] = useState(getFiltrosFromURL);
    const [areas, setAreas] = useState([]);
    const [servicos, setServicos] = useState([]);

    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [tempLocation, setTempLocation] = useState(null);
    const [tempRaio, setTempRaio] = useState(filtros.raio || '20');
    const isGeoSearch = filtros.lat && filtros.lng;

    // Ajuda para o Modal de Busca por Proximidade
    useEffect(() => {
        if (isMapModalOpen) {
            setHelpContent({
                title: 'Ajuda: Busca por Proximidade',
                content: [
                    { item: 'Ponto no Mapa', description: 'Clique no mapa para definir um ponto central para sua busca. Se você estiver logado, sua região padrão será carregada.' },
                    { item: 'Raio da Busca', description: 'Defina a distância máxima (em km) a partir do ponto central que você deseja incluir nos resultados.' },
                    { item: 'Aplicar Filtro', description: 'Clique para confirmar e refazer a busca com os novos parâmetros de localização.' },
                ]
            });
        }
        return () => {
            if (isMapModalOpen) revertHelpContent(); // This line was causing an error if revertHelpContent was not imported
        };
    }, [isMapModalOpen, setHelpContent, revertHelpContent]);

    useEffect(() => {
        setFiltros(getFiltrosFromURL());
    }, [searchParams, getFiltrosFromURL]);

    // Efeito para buscar os dados dos filtros (áreas e serviços)
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [resAreas, resServicos] = await Promise.all([
                    axios.get('/api/dados/areas'),
                    axios.get('/api/dados/servicos')
                ]);
                setAreas(resAreas.data);
                setServicos(resServicos.data);
            } catch (error) { console.error("Erro ao buscar dados para os filtros:", error); }
        };
        fetchFilterData();
    }, []);

    const fetchResultados = useCallback(async () => {
        try {
            setLoading(true);

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
        fetchResultados();
    }, [fetchResultados]);

    const updateFiltros = (novosFiltros) => {
        // Limpa chaves vazias antes de atualizar a URL
        const filtrosAtivos = {};
        for (const key in novosFiltros) {
            if (novosFiltros[key]) {
                filtrosAtivos[key] = novosFiltros[key];
            }
        }
        setSearchParams(filtrosAtivos, { replace: true });
    };

    const handleOpenMapModal = async () => {
        if (isAuthenticated && !tempLocation) {
            try {
                const resRegiao = await axios.get('/api/users/me/regiao');
                const { lat, lng, raio } = resRegiao.data;

                setTempLocation({ lat, lng });
                setTempRaio(raio);
            } catch (error) {
                console.log("Usuário sem região padrão, o mapa abrirá sem preenchimento.");
            }
        }
        setMapModalOpen(true);
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        const novosFiltros = { ...filtros, [name]: value };
        updateFiltros(novosFiltros);
    };

    const handleApplyGeoFilter = () => {
        if (tempLocation && tempRaio) {
            updateFiltros({
                ...filtros,
                lat: tempLocation.lat,
                lng: tempLocation.lng,
                raio: tempRaio,
                sortBy: 'distance'
            });
            setMapModalOpen(false);
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
            newFilters.sortBy = 'relevance';
            return newFilters;
        });
        setTempLocation(null);
        setTempRaio('20');
    };

    return (
        <>
            <div className="busca-page-container">
                <aside className="filtros-sidebar">
                    <h2>Filtros</h2>
                    <div className="form-group">
                        <label>Palavra-chave</label>
                        <input type="text" name="q" value={filtros.q} onChange={handleFiltroChange} title="Busque por termos no título ou na descrição do anúncio." />
                    </div>
                    <div className="form-group">
                        <label>Tipo de Anúncio</label>
                        <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} title="Filtre por vagas de emprego ou por prestadores de serviço.">
                            <option value="">Todos</option>
                            <option value="O">Vagas (Empresas)</option>
                            <option value="S">Serviços (Prestadores)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Especialização</label>
                        <select name="area" value={filtros.area} onChange={handleFiltroChange} title="Selecione a área de atuação principal do anúncio.">
                            <option value="">Todas</option>
                            {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Serviço Principal</label>
                        <select name="servico" value={filtros.servico} onChange={handleFiltroChange} title="Filtre pelo serviço específico que você procura.">
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
                            <button type="button" onClick={handleOpenMapModal} title="Encontre anúncios próximos a você ou a um local específico.">
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
                            <select name="sortBy" value={filtros.sortBy || 'relevance'} onChange={handleFiltroChange} title="Organize os resultados por data, avaliação ou distância.">
                                <option value="relevance">Mais Recentes</option>
                                <option value="rating">Melhores Avaliações</option>
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
            <Modal isOpen={isMapModalOpen} onClose={() => setMapModalOpen(false)} title="Buscar por Proximidade">
                <div className="modal-header-with-help">
                    <h2>Buscar por Proximidade</h2>
                    <button onClick={openHelp} className="help-button-modal" title="Ajuda (F1)">
                        <img src={helpIcon} alt="Ajuda" />
                    </button>
                </div>
                <p>Use sua localização padrão ou selecione um novo ponto no mapa.</p>
                <div style={{ height: '300px', marginBottom: '1rem' }}>
                    <LocationPicker
                        onLocationSelect={setTempLocation}
                        initialPosition={tempLocation}
                        radiusKm={tempRaio}
                    />
                </div>
                <div className="form-group">
                    <label>Raio da Busca (em km)</label>
                    <input
                        type="number"
                        value={tempRaio}
                        onChange={(e) => setTempRaio(e.target.value)}
                        placeholder="Ex: 20"
                        title="Defina a distância máxima em quilômetros para a busca a partir do ponto central."
                    />
                </div>
                <button type="button" className="btn btn-primary" onClick={handleApplyGeoFilter}>
                    Aplicar Filtro
                </button>
            </Modal>
        </>
    );
}

export default Busca;