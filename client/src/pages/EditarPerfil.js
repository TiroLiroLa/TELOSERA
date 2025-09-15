// client/src/pages/EditarPerfil.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal'; // <<< 1. Importar o Modal
import LocationPicker from '../components/LocationPicker'; // <<< 2. Importar o mapa
import CityAutocomplete from '../components/CityAutocomplete';
import { Link } from 'react-router-dom';
import './EditarPerfil.css'; // Importa o novo CSS

const EditarPerfil = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('dados'); // 'dados', 'especialidades', 'regiao'
  // Estados para cada formulário
  const [dadosFormData, setDadosFormData] = useState({ nome: '', telefone: '' });
  const [todasAreas, setTodasAreas] = useState([]);
  const [minhasAreas, setMinhasAreas] = useState(new Set());
  const [regiaoData, setRegiaoData] = useState({ location: null, raio: '', estadoId: '', city: null });
  // <<< 3. Novos estados para o modal e a localização
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState(null);
  const [newRaio, setNewRaio] = useState('');
  const [estados, setEstados] = useState([]);
  const [selectedEstadoId, setSelectedEstadoId] = useState('');
  const [selectedCity, setSelectedCity] = useState(null); 

  
  useEffect(() => {
    // Preenche o formulário com os dados atuais do usuário
    if (user) {
      setDadosFormData({ nome: user.nome || '', telefone: user.telefone || '' });
    }

    // Busca todas as áreas disponíveis e as áreas que o usuário já selecionou
    const fetchData = async () => {
        if (!user) return;
        try {
            const [resTodasAreas, resMinhasAreas, resEstados] = await Promise.all([
                axios.get('/api/dados/areas'),
                axios.get('/api/users/me/areas'),
                axios.get('/api/dados/estados')
            ]);
            setTodasAreas(resTodasAreas.data);
            setMinhasAreas(new Set(resMinhasAreas.data.map(area => area.id_area)));
            setEstados(resEstados.data);
        } catch (error) {
            console.error("Erro ao carregar dados para edição", error);
        }
    };
    fetchData();

    // <<< 2. useEffect para buscar os estados
    const fetchEstados = async () => {
        try {
            const res = await axios.get('/api/dados/estados');
            setEstados(res.data);
        } catch (err) {
            console.error("Erro ao buscar estados", err);
        }
    };
    fetchEstados();
  }, [user]);

  const handleCreateCity = async (cityName) => {
      try {
          const res = await axios.post('/api/dados/cidades', { nome: cityName, fk_id_estado: selectedEstadoId });
          return res.data; // Retorna o objeto da nova cidade {id_cidade, nome}
      } catch (error) {
          alert("Erro ao criar nova cidade.");
          return null;
      }
  };
  
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
      await axios.put('/api/users/me', dadosFormData);
      alert('Dados atualizados com sucesso!');
      // Idealmente, o AuthContext seria atualizado aqui
    } catch (err) {
      alert('Erro ao atualizar dados.');
    }
  };
  
  const onAreasSubmit = async e => {
    e.preventDefault();
    try {
      const areasParaEnviar = { areas: Array.from(minhasAreas) };
      await axios.put('/api/users/me/areas', areasParaEnviar);
      alert('Áreas de atuação atualizadas com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar áreas.');
    }
  };

  // <<< FUNÇÃO CHAMADA AO CLICAR NO MAPA
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
        await axios.put('/api/users/me/regiao', dadosParaEnviar);
        alert('Região de atuação atualizada com sucesso!');
        setIsModalOpen(false); // Fecha o modal após o sucesso
    } catch (err) {
        alert('Erro ao atualizar a região.');
        console.error(err);
    }
  };


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
                <Link to={`/perfil/${user.id_usuario}`} style={{marginTop: '1rem', display: 'block'}}>
                    &larr; Voltar para o Perfil Público
                </Link>
            </aside>

            <main className="edit-perfil-main">
                {activeSection === 'dados' && (
                    <section className="edit-section">
                        <h2>Dados Básicos</h2>
                        <form onSubmit={onDadosSubmit}>
                            <div className="form-group">
                                <label>Nome / Razão Social</label>
                                <input type="text" name="nome" value={dadosFormData.nome} onChange={e => setDadosFormData({...dadosFormData, nome: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Telefone</label>
                                <input type="tel" name="telefone" value={dadosFormData.telefone} onChange={e => setDadosFormData({...dadosFormData, telefone: e.target.value})} />
                            </div>
                            <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                        </form>
                    </section>
                )}

                {activeSection === 'especialidades' && (
                    <section className="edit-section">
                        <h2>Minhas Especialidades</h2>
                        <form onSubmit={onAreasSubmit}>
                            <div className="especialidades-grid">
                                {todasAreas.map(area => (
                                    <label key={area.id_area} className="checkbox-label">
                                        <input type="checkbox" checked={minhasAreas.has(area.id_area)} onChange={() => handleAreaChange(area.id_area)} />
                                        {area.nome}
                                    </label>
                                ))}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{marginTop: '1.5rem'}}>Salvar Especialidades</button>
                        </form>
                    </section>
                )}

                {activeSection === 'regiao' && (
                    <section className="edit-section">
                        <h2>Região de Atuação</h2>
                        <p>Defina a cidade central, o ponto no mapa e o raio onde você atua.</p>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-secondary">
                            Abrir Editor de Região
                        </button>
                    </section>
                )}
            </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Selecione sua nova região de atuação</h2>
        <form onSubmit={onRegiaoSubmit}>
            {/* <<< PASSA O RAIO ATUAL PARA O LOCATIONPICKER */}
            <LocationPicker 
              onLocationSelect={onLocationSelect}
              initialPosition={newLocation}
              radiusKm={newRaio} 
            />
            {/* <<< 3. Código completo do seletor de estados */}
            <select 
                value={selectedEstadoId} 
                onChange={e => {
                    setSelectedEstadoId(e.target.value);
                    setSelectedCity(null); // Reseta a cidade
                }}
                required
            >
                <option value="">-- Selecione um Estado --</option>
                {estados.map(estado => (
                    <option key={estado.id_estado} value={estado.id_estado}>
                        {estado.nome} ({estado.uf})
                    </option>
                ))}
            </select>
            <CityAutocomplete
                estadoId={selectedEstadoId}
                onCitySelect={setSelectedCity}
                onCityCreate={handleCreateCity}
                selectedCity={selectedCity} // <<< A prop mudou para 'selectedCity'
            />
            {selectedCity && <p>Cidade selecionada: <strong>{selectedCity.nome}</strong></p>}
            <label>
                Novo Raio de Atuação (em km):
                <input
                    type="number"
                    value={newRaio}
                    onChange={(e) => setNewRaio(e.target.value)}
                    placeholder="Ex: 50"
                    required
                />
            </label>
            <button type="submit" style={{ marginTop: '1rem' }}>Salvar Nova Região</button>
        </form>
      </Modal>
    </div>
  );
};

export default EditarPerfil;