import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import CityAutocomplete from '../components/CityAutocomplete';
import { Link, useNavigate } from 'react-router-dom';
import './EditarPerfil.css';
import RequiredNotice from '../components/RequiredNotice'; // <--- adicionado
import { useHelp } from '../context/HelpContext';
import helpIcon from '../assets/help-circle.svg';

const EditarPerfil = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dados');
    const [dadosFormData, setDadosFormData] = useState({ nome: '', telefone: '' });
    const [todasAreas, setTodasAreas] = useState([]);
    const [minhasAreas, setMinhasAreas] = useState(new Set());
    const [regiaoData, setRegiaoData] = useState({ location: null, raio: '', estadoId: '', city: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLocation, setNewLocation] = useState(null);
    const [newRaio, setNewRaio] = useState('');
    const [estados, setEstados] = useState([]);
    const [selectedEstadoId, setSelectedEstadoId] = useState('');
    const [selectedCity, setSelectedCity] = useState(null);
    const { setHelpContent, revertHelpContent, openHelp } = useHelp();

    useEffect(() => {
        setHelpContent({
            title: 'Ajuda: Editar Perfil',
            content: [
                { item: 'Navegação', description: 'Use o menu à esquerda para alternar entre a edição de "Dados Básicos", "Especialidades" e "Região de Atuação".' },
                { item: 'Dados Básicos', description: 'Atualize seu nome/razão social e telefone. O nome é obrigatório.' },
                { item: 'Especialidades', description: 'Selecione ou desmarque as áreas em que você atua. Use a busca para encontrar especialidades rapidamente.' },
                { item: 'Região de Atuação', description: 'Clique em "Abrir Editor de Região" para definir sua cidade principal, um ponto exato no mapa e o raio em quilômetros que você atende.' },
            ]
        });
    }, [setHelpContent]);

    // Ajuda para o Modal de Região
    useEffect(() => {
        if (isModalOpen) {
            setHelpContent({
                title: 'Ajuda: Editor de Região',
                content: [
                    { item: 'Cidade', description: 'Selecione sua cidade principal de atuação.' },
                    { item: 'Ponto Central', description: 'Ajuste o pino no mapa para o ponto exato de onde seu raio de atuação deve começar (ex: seu escritório).' },
                    { item: 'Raio de Atuação', description: 'Defina em quilômetros a distância que você está disposto a viajar para realizar um serviço.' },
                ]
            });
        }
        return () => {
            if (isModalOpen) revertHelpContent(); // This line was causing an error if revertHelpContent was not imported
        };
    }, [isModalOpen, setHelpContent, revertHelpContent]);

    useEffect(() => {

        if (user) {
            setDadosFormData({ nome: user.nome || '', telefone: user.telefone || '' });
        }

        const fetchData = async () => {
            if (!user) return;
            try {
                const [resTodasAreas, resMinhasAreas, resEstados, resMinhaRegiao] = await Promise.all([
                    api.get('/api/dados/areas'),
                    api.get('/api/users/me/areas'),
                    api.get('/api/dados/estados'),
                    api.get('/api/users/me/regiao').catch(err => null) // Não quebra se o usuário não tiver região
                ]);
                setTodasAreas(resTodasAreas.data);
                setMinhasAreas(new Set(resMinhasAreas.data.map(area => area.id_area)));
                setEstados(resEstados.data);

                if (resMinhaRegiao && resMinhaRegiao.data) {
                    const { lat, lng, raio } = resMinhaRegiao.data;
                    setNewLocation({ lat, lng });
                    setNewRaio(raio);
                }

            } catch (error) {
                console.error("Erro ao carregar dados para edição", error);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const syncMapToCity = async () => {
            if (selectedCity && selectedEstadoId) {
                const estado = estados.find(e => e.id_estado === parseInt(selectedEstadoId));
                if (estado) {
                    try {
                        const query = `city=${encodeURIComponent(selectedCity.nome)}&state=${encodeURIComponent(estado.uf)}&country=Brazil`;
                        const res = await api.get(`https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`, {
                            headers: { 'User-Agent': 'TeloseraApp/1.0 (seu.email@exemplo.com)' }
                        });
                        if (res.data && res.data.length > 0) {
                            const { lat, lon } = res.data[0];
                            setNewLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
                        }
                    } catch (error) {
                        console.error("Erro ao buscar coordenadas da cidade:", error);
                    }
                }
            }
        };
        syncMapToCity();
    }, [selectedCity, selectedEstadoId, estados]);

    const handleAreaChange = (idArea) => {
        const newSelection = new Set(minhasAreas);
        if (newSelection.has(idArea)) {
            newSelection.delete(idArea);
        } else {
            newSelection.add(idArea);
        }
        setMinhasAreas(newSelection);
    };

    if (authLoading) return <div>Carregando...</div>;
    if (!user) return <div>Você precisa estar logado para editar o perfil.</div>;

    const onDadosSubmit = async e => {
        e.preventDefault();
        try {
            await api.put('/api/users/me', dadosFormData);
            alert('Dados atualizados com sucesso!');
        } catch (err) {
            alert('Erro ao atualizar dados.');
        }
    };

    const onAreasSubmit = async e => {
        e.preventDefault();
        try {
            const areasParaEnviar = { areas: Array.from(minhasAreas) };
            await api.put('/api/users/me/areas', areasParaEnviar);
            alert('Áreas de atuação atualizadas com sucesso!');
        } catch (err) {
            alert('Erro ao atualizar áreas.');
        }
    };

    const onLocationSelect = (latlng) => {
        setNewLocation(latlng);
    };

    const onRegiaoSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCity) return alert("Por favor, selecione a cidade.");
        if (!newLocation || !newRaio) {
            alert('Por favor, selecione um local no mapa e defina um raio.');
            return;
        }

        try {
            const dadosParaEnviar = {
                localizacao: newLocation,
                raio_atuacao: newRaio,
                fk_id_cidade: selectedCity.id_cidade
            };
            await api.put('/api/users/me/regiao', dadosParaEnviar);
            alert('Região de atuação atualizada com sucesso!');
            setIsModalOpen(false);
        } catch (err) {
            alert('Erro ao atualizar a região.');
            console.error(err);
        }
    };

    if (authLoading) return <div>Carregando...</div>;
    if (!user) return <div>Você precisa estar logado para editar o perfil.</div>;

    return (
        <div className="edit-perfil-container">
            <aside className="edit-perfil-sidebar">
                <ul className="edit-perfil-nav">
                    <li>
                        <a href="#"
                            className={activeSection === 'dados' ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setActiveSection('dados'); }}>
                            Dados Básicos
                        </a>
                    </li>
                    <li>
                        <a href="#"
                            className={activeSection === 'especialidades' ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setActiveSection('especialidades'); }}>
                            Especialidades
                        </a>
                    </li>
                    <li>
                        <a href="#"
                            className={activeSection === 'regiao' ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setActiveSection('regiao'); }}>
                            Região de Atuação
                        </a>
                    </li>
                </ul>
                <Link to={`/perfil/${user.id_usuario}`} style={{ marginTop: '1rem', display: 'block' }}>
                    &larr; Voltar para o Perfil Público
                </Link>
            </aside>

            <main className="edit-perfil-main">
                <RequiredNotice /> {/* <-- aviso inserido no topo da área principal */}
                {activeSection === 'dados' && (
                    <section className="edit-section">
                        <h2>Dados Básicos</h2>
                        <form onSubmit={onDadosSubmit}>
                            <div className="form-group"><label className="required">Nome / Razão Social</label><input type="text" name="nome" value={dadosFormData.nome} onChange={e => setDadosFormData({ ...dadosFormData, nome: e.target.value })} title="Seu nome de exibição público na plataforma." /></div>
                            <div className="form-group"><label>Telefone</label><input type="tel" name="telefone" value={dadosFormData.telefone} onChange={e => setDadosFormData({ ...dadosFormData, telefone: e.target.value })} title="Seu telefone de contato, que será visível para outros usuários logados nos seus anúncios." /></div>
                            <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                        </form>
                    </section>
                )}

                {activeSection === 'especialidades' && (
                    <section className="edit-section">
                        <h2>Minhas Especialidades</h2>
                        <form onSubmit={onAreasSubmit}>
                            <div className="search-box" style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar especialidades..."
                                    title="Digite para filtrar a lista de especialidades abaixo."
                                    onChange={(e) => {
                                        const searchBox = e.target;
                                        const filter = searchBox.value.toLowerCase();
                                        const labels = document.querySelectorAll('.especialidades-grid .checkbox-label');
                                        
                                        labels.forEach(label => {
                                            const text = label.textContent.toLowerCase();
                                            label.style.display = text.includes(filter) ? '' : 'none';
                                        });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginBottom: '1rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            
                            <div className="especialidades-grid" style={{ 
                                maxHeight: '400px', 
                                overflowY: 'auto',
                                padding: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}>
                                {todasAreas.map(area => (
                                    <label key={area.id_area} className="checkbox-label" style={{
                                        display: 'flex',
                                        padding: '0.5rem',
                                        marginBottom: '0.5rem',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={minhasAreas.has(area.id_area)} 
                                            onChange={() => handleAreaChange(area.id_area)}
                                            style={{ marginRight: '1rem' }}
                                        />
                                        {area.nome}
                                    </label>
                                ))}
                            </div>
                            
                            <div style={{ 
                                marginTop: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{minhasAreas.size} especialidade(s) selecionada(s)</span>
                                <button type="submit" className="btn btn-primary">
                                    Salvar Especialidades
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {activeSection === 'regiao' && (
                    <section className="edit-section">
                        <h2>Região de Atuação</h2>
                        <p>Defina a cidade central, o ponto no mapa e o raio onde você atua.</p>
                        <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-secondary">Abrir Editor de Região</button>
                    </section>
                )}
            </main>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editor de Região">
                <div className="modal-header-with-help">
                    <h2>Selecione sua nova região de atuação</h2>
                    <button onClick={openHelp} className="help-button-modal" title="Ajuda (F1)">
                        <img src={helpIcon} alt="Ajuda" />
                    </button>
                </div>
                <form onSubmit={onRegiaoSubmit}>
                    <div className="form-group"><label>Estado</label><select value={selectedEstadoId} onChange={e => { setSelectedEstadoId(e.target.value); setSelectedCity(null); }} required><option value="">-- Selecione um Estado --</option>{estados.map(estado => (<option key={estado.id_estado} value={estado.id_estado}>{estado.nome} ({estado.uf})</option>))}</select></div>
                    <div className="form-group"><label>Cidade</label><CityAutocomplete estadoId={selectedEstadoId} onCitySelect={setSelectedCity} selectedCity={selectedCity} /></div>
                    <div className="form-group"><label>Ponto Central (Ajuste Fino)</label><div style={{height: '250px'}}><LocationPicker onLocationSelect={onLocationSelect} initialPosition={newLocation} radiusKm={newRaio} /></div></div>
                    <div className="form-group"><label>Novo Raio de Atuação (em km):</label><input type="number" value={newRaio} onChange={(e) => setNewRaio(e.target.value)} placeholder="Ex: 50" required title="A distância máxima que você atende a partir do ponto central." /></div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Salvar Nova Região</button>
                </form>
            </Modal>
        </div>
    );
};

export default EditarPerfil;