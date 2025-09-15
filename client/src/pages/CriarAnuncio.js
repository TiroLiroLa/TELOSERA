// client/src/pages/CriarAnuncio.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import Modal from '../components/Modal';

// Componente de Autocomplete (pode ser movido para um arquivo próprio depois)
const CityAutocomplete = ({ estadoId, onCitySelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            const res = await axios.get(`/api/dados/cidades?q=${query}&estadoId=${estadoId}`);
            setSuggestions(res.data);
        };
        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, estadoId]);
    
    return (
        <div>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Digite o nome da cidade" />
            <ul>
                {suggestions.map(city => (
                    <li key={city.id_cidade} onClick={() => onCitySelect(city)}>
                        {city.nome}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const CriarAnuncio = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [estados, setEstados] = useState([]);
  const [selectedEstadoId, setSelectedEstadoId] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'O',
    fk_Area_id_area: '',
    fk_id_servico: '',
  });

  useEffect(() => {
    // Busca estados
    const fetchEstados = async () => {
          try {
              const res = await axios.get('/api/dados/estados');
              setEstados(res.data);
          } catch (err) {
              console.error("Erro ao buscar estados", err);
          }
      };
      fetchEstados();
    // Busca os dados para os dropdowns de Área e Serviço
    const fetchData = async () => {
      try {
        const [resAreas, resServicos] = await Promise.all([
          axios.get('/api/dados/areas'),
          axios.get('/api/dados/servicos')
        ]);
        setAreas(resAreas.data);
        setServicos(resServicos.data);
      } catch (error) {
        console.error("Erro ao buscar dados para o formulário", error);
      }
    };
    fetchData();
  }, []);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onLocationSelect = async (latlng) => {
      setLocation(latlng);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fk_Area_id_area || !formData.fk_id_servico) {
      return alert("Por favor, selecione uma Área e um Serviço.");
    }

    if (!selectedCity) {
      return alert("Por favor, selecione a cidade do anúncio.");
    }
    const dadosParaEnviar = { ...formData, localizacao: location, fk_id_cidade: selectedCity.id_cidade };

    try {
      await axios.post('/api/anuncios', dadosParaEnviar);
      alert('Anúncio criado com sucesso!');
      navigate('/dashboard'); // Redireciona para o painel após o sucesso
    } catch (err) {
      alert(`Erro ao criar anúncio: ${err.response?.data?.msg || err.message}`);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px', margin: 'auto' }}>
      <h1>Publicar um Novo Anúncio</h1>
      <form onSubmit={onSubmit}>
        <input type="text" name="titulo" value={formData.titulo} onChange={onChange} placeholder="Título do Anúncio" required />
        <textarea name="descricao" value={formData.descricao} onChange={onChange} placeholder="Descrição detalhada do serviço/vaga" required />
        
        <select name="fk_Area_id_area" value={formData.fk_Area_id_area} onChange={onChange} required>
            <option value="">-- Selecione a Especialização --</option>
            {areas.map(area => <option key={area.id_area} value={area.id_area}>{area.nome}</option>)}
        </select>
        
        <select name="fk_id_servico" value={formData.fk_id_servico} onChange={onChange} required>
            <option value="">-- Selecione o Serviço Principal --</option>
            {servicos.map(servico => <option key={servico.id_servico} value={servico.id_servico}>{servico.nome}</option>)}
        </select>
        
        <h3>Localização do Anúncio</h3>
        <button type="button" onClick={() => setIsModalOpen(true)}>Definir Local no Mapa</button>
        <div>
            <select value={selectedEstadoId} onChange={e => setSelectedEstadoId(e.target.value)} required>
                <option value="">-- Selecione um Estado --</option>
                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome}</option>)}
            </select>
            {selectedEstadoId && (
                <CityAutocomplete 
                    estadoId={selectedEstadoId} 
                    onCitySelect={(city) => {
                        setSelectedCity(city);
                        alert(`Cidade selecionada: ${city.nome}`);
                    }}
                />
            )}
            {selectedCity && <p>Cidade selecionada: <strong>{selectedCity.nome}</strong></p>}
        </div>

        <div className="radio-group" style={{ margin: '1rem 0' }}>
          <p>Este anúncio é uma:</p>
          <label><input type="radio" name="tipo" value="O" checked={formData.tipo === 'O'} onChange={onChange} /> Oferta de Vaga</label>
          <label><input type="radio" name="tipo" value="S" checked={formData.tipo === 'S'} onChange={onChange} /> Oferta de Serviço</label>
        </div>
        
        <button type="submit">Publicar Anúncio</button>
      </form>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Selecione o Local da Obra/Serviço</h2>
        <LocationPicker onLocationSelect={onLocationSelect} initialPosition={location} />
        <button type="button" onClick={() => setIsModalOpen(false)} style={{marginTop: '1rem'}}>Confirmar Local</button>
      </Modal>
    </div>
  );
};

export default CriarAnuncio;