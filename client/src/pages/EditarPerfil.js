// client/src/pages/EditarPerfil.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal'; // <<< 1. Importar o Modal
import LocationPicker from '../components/LocationPicker'; // <<< 2. Importar o mapa

const EditarPerfil = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ nome: '', telefone: '' });
  const [todasAreas, setTodasAreas] = useState([]);
  const [minhasAreas, setMinhasAreas] = useState(new Set()); // Usar Set para busca rápida
  // <<< 3. Novos estados para o modal e a localização
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState(null);
  const [newRaio, setNewRaio] = useState('');
  
  useEffect(() => {
    // Preenche o formulário com os dados atuais do usuário
    if (user) {
      setFormData({ nome: user.nome || '', telefone: user.telefone || '' });
    }

    // Busca todas as áreas disponíveis e as áreas que o usuário já selecionou
    const fetchData = async () => {
      try {
        const [resTodasAreas, resMinhasAreas] = await Promise.all([
          axios.get('/api/dados/areas'),
          axios.get('/api/users/me/areas')
        ]);
        setTodasAreas(resTodasAreas.data);
        // Converte o array de objetos para um Set de IDs
        setMinhasAreas(new Set(resMinhasAreas.data.map(area => area.id_area)));
      } catch (error) {
        console.error("Erro ao carregar dados do perfil", error);
      }
    };
    fetchData();
  }, [user]);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleAreaChange = (idArea) => {
    const newSelection = new Set(minhasAreas);
    if (newSelection.has(idArea)) {
      newSelection.delete(idArea);
    } else {
      newSelection.add(idArea);
    }
    setMinhasAreas(newSelection);
  };

  const onDadosSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put('/api/users/me', formData);
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

  const onLocationSelect = (latlng) => {
    setNewLocation(latlng);
  };

  const onRegiaoSubmit = async (e) => {
    e.preventDefault();
    if (!newLocation || !newRaio) {
        alert('Por favor, selecione um local no mapa e defina um raio.');
        return;
    }

    try {
        const dadosParaEnviar = {
            localizacao: newLocation,
            raio_atuacao: newRaio
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
    <div className="container">
      <h1>Editar Perfil</h1>
      <form onSubmit={onDadosSubmit}>
        <h3>Dados Básicos</h3>
        <label>Nome:</label>
        <input type="text" name="nome" value={formData.nome} onChange={onChange} />
        <label>Telefone:</label>
        <input type="tel" name="telefone" value={formData.telefone} onChange={onChange} />
        <button type="submit">Salvar Dados</button>
      </form>

      <hr style={{margin: '2rem 0'}} />

      <form onSubmit={onAreasSubmit}>
        <h3>Minhas Especialidades</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {todasAreas.map(area => (
            <label key={area.id_area}>
              <input 
                type="checkbox"
                checked={minhasAreas.has(area.id_area)}
                onChange={() => handleAreaChange(area.id_area)}
              />
              {area.nome}
            </label>
          ))}
        </div>
        <button type="submit" style={{marginTop: '1rem'}}>Salvar Especialidades</button>
      </form>
      {/* <<< 4. Nova seção para Região de Atuação */}
      <div className="regiao-edit-section">
        <h3>Região de Atuação</h3>
        <p>Edite sua localização base e raio de atendimento.</p>
        <button type="button" onClick={() => setIsModalOpen(true)}>
          Alterar Região
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Selecione sua nova região de atuação</h2>
        <form onSubmit={onRegiaoSubmit}>
            {/* <<< PASSA O RAIO ATUAL PARA O LOCATIONPICKER */}
            <LocationPicker 
              onLocationSelect={onLocationSelect}
              initialPosition={newLocation}
              radiusKm={newRaio} 
            />
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