import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { AuthContext } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import Modal from '../components/Modal';
import CityAutocomplete from '../components/CityAutocomplete';
import { Tabs, Tab } from '../components/Tabs';
import './CriarAnuncio.css';

const CriarAnuncio = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        tipo: user?.tipo_usuario === 'P' ? 'S' : 'O',
        fk_Area_id_area: '',
        fk_id_servico: '',
    });

    const [areas, setAreas] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [dataServico, setDataServico] = useState(new Date());
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [errors, setErrors] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [estados, setEstados] = useState([]);
    const [regiaoEstadoId, setRegiaoEstadoId] = useState('');
    const [regiaoCity, setRegiaoCity] = useState(null);

    useEffect(() => {
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

    useEffect(() => {
        const syncMapToCity = async () => {
            if (regiaoCity && regiaoEstadoId) {
                const estado = estados.find(e => e.id_estado === parseInt(regiaoEstadoId));
                if (estado) {
                    try {
                        const query = `city=${encodeURIComponent(regiaoCity.nome)}&state=${encodeURIComponent(estado.uf)}&country=Brazil`;
                        const res = await axios.get(`https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`, {
                            headers: { 'User-Agent': 'TeloseraApp/1.0 (seu.email@exemplo.com)' }
                        });
                        if (res.data && res.data.length > 0) {
                            const { lat, lon } = res.data[0];
                            setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
                        }
                    } catch (error) {
                        console.error("Erro ao buscar coordenadas da cidade:", error);
                    }
                }
            }
        };
        syncMapToCity();
    }, [regiaoCity, regiaoEstadoId, estados]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length > 5) {
                alert("Você pode selecionar no máximo 5 imagens.");
                e.target.value = null;
                return;
            }
            setSelectedFiles(filesArray);

            previewImages.forEach(url => URL.revokeObjectURL(url));

            const previewUrls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewImages(previewUrls);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        const dadosFormulario = {
            ...formData,
            data_servico: dataServico.toISOString(),
            fk_id_cidade: regiaoCity?.id_cidade,
            localizacao: location
        };

        const data = new FormData();

        for (let i = 0; i < selectedFiles.length; i++) {
            data.append('images', selectedFiles[i]);
        }

        data.append('jsonData', JSON.stringify(dadosFormulario));

        try {
            await axios.post('/api/anuncios', data);
            alert('Anúncio criado com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            setErrors({ api: err.response?.data?.msg || 'Erro ao criar anúncio.' });
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCreateCity = async (cityName, estadoId) => {
        if (!estadoId) { alert("Selecione um estado."); return null; }
        try {
            const res = await axios.post('/api/dados/cidades', { nome: cityName, fk_id_estado: estadoId });
            return res.data;
        } catch (error) { alert("Erro ao criar cidade."); return null; }
    };
    const onLocationSelect = (latlng) => { setLocation(latlng); };

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

    return (
        <div className="criar-anuncio-container">
            <h1>{textosUI.tituloPagina || 'Publicar Anúncio'}</h1>
            <form onSubmit={onSubmit} noValidate>
                {errors.api && <div className="error-message">{errors.api}</div>}

                {/* --- Campos do Formulário --- */}
                <div className="form-group">
                    <label>Tipo de Anúncio</label>
                    <div className="radio-group" style={{ display: 'flex', gap: '1rem' }}>
                        <label><input type="radio" name="tipo" value="O" checked={isOfertaDeVaga} onChange={onChange} /> Vaga de Emprego</label>
                        <label><input type="radio" name="tipo" value="S" checked={!isOfertaDeVaga} onChange={onChange} /> Oferta de Serviço</label>
                    </div>
                </div>
                <div className="form-group">
                    <label className="required">{textosUI.labelTitulo || 'Título'}</label>
                    <input type="text" name="titulo" value={formData.titulo} onChange={onChange} placeholder={textosUI.placeholderTitulo} required />
                </div>
                <div className="form-group">
                    <label className="required">{textosUI.labelDescricao || 'Descrição'}</label>
                    <textarea name="descricao" value={formData.descricao} onChange={onChange} rows="5" required />
                </div>
                <div className="form-group">
                    <label className="required">Especialização</label>
                    <select name="fk_Area_id_area" value={formData.fk_Area_id_area} onChange={onChange} required>
                        <option value="">-- Selecione uma especialização --</option>
                        {areas.map(area => (
                            <option key={area.id_area} value={area.id_area}>
                                {area.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Serviço Principal</label>
                    <select name="fk_id_servico" value={formData.fk_id_servico} onChange={onChange} required>
                        <option value="">-- Selecione um serviço --</option>
                        {servicos.map(servico => (
                            <option key={servico.id_servico} value={servico.id_servico}>
                                {servico.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">{textosUI.labelData || 'Data'}</label>
                    <DatePicker selected={dataServico} onChange={(date) => setDataServico(date)} dateFormat="dd/MM/yyyy" minDate={new Date()} className="custom-datepicker-input" />
                </div>

                {/* --- Upload de Imagens --- */}
                <hr style={{ margin: "1rem 0" }} />
                <h3>Imagens do Anúncio (até 5)</h3>
                <div className="form-group">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                    {previewImages.map((url, index) => (
                        <img key={index} src={url} alt={`Preview ${index}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                    ))}
                </div>

                {/* --- Localização --- */}
                <hr style={{ margin: "1rem 0" }} />
                <h3>{textosUI.labelLocal || 'Localização'}</h3>
                {regiaoCity && <div className="summary-box">Cidade definida: <strong>{regiaoCity.nome}</strong></div>}
                <button type="button" onClick={() => setIsModalOpen(true)} style={{ marginBottom: '1.5rem' }}>
                    {regiaoCity ? 'Alterar Localização' : 'Definir Localização'}
                </button>

                <button type="submit" className="btn btn-primary">{textosUI.botaoSubmit || 'Publicar'}</button>
            </form>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Definir Localização</h2>
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
                            <div style={{ height: '250px' }}>
                                {/* Conecta a função simplificada */}
                                <LocationPicker onLocationSelect={onLocationSelect} initialPosition={location} />
                            </div>
                        </div>
                    </Tab>
                </Tabs>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-primary" style={{ marginTop: '2rem' }}>Confirmar</button>
            </Modal>
        </div>
    );
};

export default CriarAnuncio;