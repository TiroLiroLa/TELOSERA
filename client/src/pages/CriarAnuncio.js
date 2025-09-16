// client/src/pages/CriarAnuncio.js
import React, { useState, useEffect, useContext } from 'react'; // <<< Importar useContext
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import Modal from '../components/Modal';
import DatePicker from 'react-datepicker'; // <<< 1. Importar o DatePicker
import "react-datepicker/dist/react-datepicker.css"; // <<< 2. Importar o CSS do DatePicker

// Importe os outros componentes
import CityAutocomplete from '../components/CityAutocomplete';
import { Tabs, Tab } from '../components/Tabs';
import './CriarAnuncio.css';
import { AuthContext } from '../context/AuthContext'; // <<< Importar AuthContext

const CriarAnuncio = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // <<< Pega o tipo de usuário logado
    // <<< 1. O 'tipo' do formulário agora é inicializado com base no tipo do usuário
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        tipo: user?.tipo_usuario === 'P' ? 'S' : 'O', // 'S' para Prestador, 'O' para Empresa
        fk_Area_id_area: '',
        fk_id_servico: '',
    });
    
    // <<< 3. Estado separado para a data
    const [dataServico, setDataServico] = useState(new Date()); 
    const [errors, setErrors] = useState({});

    // Estados para dropdowns e modal
    const [areas, setAreas] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [estados, setEstados] = useState([]);
    const [regiaoEstadoId, setRegiaoEstadoId] = useState('');
    const [regiaoCity, setRegiaoCity] = useState(null);

    useEffect(() => {
        // Busca dados para os dropdowns (estados, áreas, serviços)
        const fetchData = async () => {
            try {
                const [resAreas, resServicos, resEstados] = await Promise.all([
                    axios.get('/api/dados/areas'),
                    axios.get('/api/dados/servicos'),
                    axios.get('/api/dados/estados')
                ]);
                setAreas(resAreas.data);
                setServicos(resServicos.data);
                setEstados(resEstados.data);
            } catch (error) { console.error("Erro ao buscar dados", error); }
        };
        fetchData();
    }, []);

    const isOfertaDeVaga = formData.tipo === 'O';
    const textosUI = {
        tituloPagina: isOfertaDeVaga ? "Publicar Nova Vaga" : "Oferecer Meus Serviços",
        labelTitulo: isOfertaDeVaga ? "Título da Vaga" : "Título do Serviço Oferecido",
        placeholderTitulo: isOfertaDeVaga ? "Ex: Eletricista para obra residencial" : "Ex: Montador de Torres com experiência",
        labelDescricao: isOfertaDeVaga ? "Descrição da Vaga e Requisitos" : "Descrição dos Seus Serviços e Experiências",
        labelData: isOfertaDeVaga ? "Data de Início do Serviço" : "Disponível a partir de",
        labelLocal: isOfertaDeVaga ? "Local da Obra" : "Minha Localização Base",
        botaoSubmit: isOfertaDeVaga ? "Publicar Vaga" : "Publicar Disponibilidade"
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        
        const dadosParaEnviar = { 
            ...formData, 
            localizacao: location,
            fk_id_cidade: regiaoCity?.id_cidade,
            data_servico: dataServico // <<< 4. Adiciona a data ao objeto de envio
        };

        try {
            await axios.post('/api/anuncios', dadosParaEnviar);
            alert('Anúncio criado com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            setErrors({ api: err.response?.data?.msg || 'Erro ao criar anúncio.' });
        }
    };

  const handleCreateCity = async (cityName) => {
      try {
          const res = await axios.post('/api/dados/cidades', { nome: cityName, fk_id_estado: regiaoEstadoId });
          return res.data; // Retorna o objeto da nova cidade {id_cidade, nome}
      } catch (error) {
          alert("Erro ao criar nova cidade.");
          return null;
      }
  };

  const onLocationSelect = async (latlng) => {
      setLocation(latlng);
  };

  return (
        <div className="criar-anuncio-container">
            <h1>Publicar um Novo Anúncio</h1>
            <form onSubmit={onSubmit} noValidate>
                {errors.api && <div className="error-message">{errors.api}</div>}

                <div className="form-group">
                    <label>Tipo de Anúncio</label>
                    <div className="radio-group" style={{ display: 'flex', gap: '1rem' }}>
                        <label>
                            <input type="radio" name="tipo" value="O" checked={formData.tipo === 'O'} onChange={onChange} /> 
                            Estou procurando um profissional (Vaga)
                        </label>
                        <label>
                            <input type="radio" name="tipo" value="S" checked={formData.tipo === 'S'} onChange={onChange} /> 
                            Estou oferecendo meus serviços
                        </label>
                    </div>
                </div>
                <div className="form-group">
                    <label>{textosUI.labelTitulo}</label>
                    <input type="text" name="titulo" value={formData.titulo} onChange={onChange} placeholder={textosUI.placeholderTitulo} required />
                </div>
                <div className="form-group">
                    <label>{textosUI.labelDescricao}</label>
                    <textarea name="descricao" value={formData.descricao} onChange={onChange} rows="5" required />
                </div>
                <div className="form-group">
                    <label>Especialização Necessária</label>
                    <select name="fk_Area_id_area" value={formData.fk_Area_id_area} onChange={onChange} required>
                        <option value="">-- Selecione --</option>
                        {areas.map(area => <option key={area.id_area} value={area.id_area}>{area.nome}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Serviço Principal</label>
                    <select name="fk_id_servico" value={formData.fk_id_servico} onChange={onChange} required>
                        <option value="">-- Selecione --</option>
                        {servicos.map(servico => <option key={servico.id_servico} value={servico.id_servico}>{servico.nome}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>{textosUI.labelData}</label>
                    <DatePicker 
                        selected={dataServico} 
                        onChange={(date) => setDataServico(date)}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        className="custom-datepicker-input"
                    />
                </div>

                <hr style={{margin: "1rem 0"}}/>
                <h3>Localização da Obra/Serviço</h3>
                {regiaoCity && <div className="summary-box">Cidade definida: <strong>{regiaoCity.nome}</strong></div>}
                <button type="button" onClick={() => setIsModalOpen(true)} style={{marginBottom: '1.5rem'}}>
                    {regiaoCity ? 'Alterar Localização' : 'Definir Localização'}
                </button>
                
                <button type="submit" className="btn btn-primary">Publicar Anúncio</button>
            </form>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Definir Localização</h2>
                {/* O conteúdo do Modal com abas para Estado/Cidade e Mapa/Raio permanece o mesmo */}
                <Tabs>
                    <Tab label="1. Cidade">
                        <div className="form-group">
                            <label>Estado</label>
                            <select value={regiaoEstadoId} onChange={e => { setRegiaoEstadoId(e.target.value); setRegiaoCity(null); }} required>
                                <option value="">-- Selecione --</option>
                                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cidade Central da Região</label>
                            <CityAutocomplete estadoId={regiaoEstadoId} onCitySelect={setRegiaoCity} onCityCreate={(cityName) => handleCreateCity(cityName, regiaoEstadoId)} selectedCity={regiaoCity} />
                        </div>
                    </Tab>
                    <Tab label="2. Ponto no Mapa">
                         <div className="form-group">
                            <label>Ponto Exato (Opcional)</label>
                            <div style={{height: '250px'}}> 
                                <LocationPicker onLocationSelect={onLocationSelect} initialPosition={location} />
                            </div>
                        </div>
                    </Tab>
                </Tabs>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-primary" style={{marginTop: '2rem'}}>Confirmar</button>
            </Modal>
        </div>
    );
};

export default CriarAnuncio;