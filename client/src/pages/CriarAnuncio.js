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
import RequiredNotice from '../components/RequiredNotice'; // <--- adicionado
import { useHelp } from '../context/HelpContext';
import helpIcon from '../assets/help-circle.svg';

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
    const [isSubmitting, setIsSubmitting] = useState(false); // <<< Novo estado de carregamento
    const { setHelpContent, revertHelpContent, openHelp } = useHelp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [estados, setEstados] = useState([]);
    const [regiaoEstadoId, setRegiaoEstadoId] = useState('');
    const [regiaoCity, setRegiaoCity] = useState(null);

    useEffect(() => {
        setHelpContent({
            title: 'Ajuda: Criar Anúncio',
            content: [
                { item: 'Campos Obrigatórios', description: 'Todos os campos com um asterisco (*) vermelho são de preenchimento obrigatório.' },
                { item: 'Tipo de Anúncio', description: 'Selecione "Vaga de Emprego" se você está contratando, ou "Oferta de Serviço" se você está oferecendo seu trabalho.' },
                { item: 'Imagens', description: 'Você pode enviar até 5 imagens para ilustrar seu anúncio. Elas serão verificadas por nossa moderação de conteúdo.' },
                { item: 'Localização', description: 'Clique em "Definir Localização" para abrir o modal. Nele, você deve definir a cidade e, opcionalmente, ajustar o pino no mapa para um local mais exato.' },
                { item: 'Moderação de Conteúdo', description: 'Ao publicar, o texto e as imagens passarão por uma verificação automática de segurança. Anúncios com conteúdo impróprio serão bloqueados.' },
            ]
        });
    }, [setHelpContent]);

    // Ajuda para o Modal de Localização
    useEffect(() => {
        if (isModalOpen) {
            setHelpContent({
                title: 'Ajuda: Localização do Anúncio',
                content: [
                    { item: 'Cidade', description: 'Selecione o estado e a cidade onde o serviço será realizado ou de onde você está ofertando.' },
                    { item: 'Ponto no Mapa', description: 'Opcionalmente, ajuste o pino no mapa para indicar um local mais preciso. Isso ajuda os candidatos a calcularem a distância.' },
                ]
            });
        }
        return () => {
            if (isModalOpen) revertHelpContent();
        };
    }, [isModalOpen, setHelpContent, revertHelpContent]);

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

    const validateForm = () => {
        const newErrors = {};
        const { titulo, descricao, fk_Area_id_area, fk_id_servico } = formData;

        if (!titulo.trim()) newErrors.titulo = 'O título é obrigatório.';
        if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
        if (!fk_Area_id_area) newErrors.fk_Area_id_area = 'A especialização é obrigatória.';
        if (!fk_id_servico) newErrors.fk_id_servico = 'O serviço principal é obrigatório.';
        if (!regiaoCity) newErrors.localizacao = 'É obrigatório definir a localização.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsSubmitting(true); // <<< Ativa o estado de carregamento


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
        } finally {
            setIsSubmitting(false); // <<< Desativa o estado de carregamento, independentemente do resultado
        }
    };

    const onChange = e => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Limpa o erro do campo específico ao ser alterado
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
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
                <RequiredNotice /> {/* <-- aviso inserido */}

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
                    <input type="text" name="titulo" value={formData.titulo} onChange={onChange} placeholder={textosUI.placeholderTitulo} required title="Crie um título claro e objetivo para o seu anúncio." />
                    {errors.titulo && <span className="field-error">{errors.titulo}</span>}
                </div>
                <div className="form-group">
                    <label className="required">{textosUI.labelDescricao || 'Descrição'}</label>
                    <textarea name="descricao" value={formData.descricao} onChange={onChange} rows="5" required title="Descreva em detalhes o serviço oferecido ou a vaga disponível. Inclua requisitos, diferenciais, etc." />
                    {errors.descricao && <span className="field-error">{errors.descricao}</span>}
                </div>
                <div className="form-group">
                    <label className="required">Especialização</label>
                    <select name="fk_Area_id_area" value={formData.fk_Area_id_area} onChange={onChange} required title="Selecione a principal área de atuação relacionada a este anúncio.">
                        <option value="">-- Selecione uma especialização --</option>
                        {areas.map(area => (
                            <option key={area.id_area} value={area.id_area} >
                                {area.nome}
                            </option>
                        ))}
                    </select>
                    {errors.fk_Area_id_area && <span className="field-error">{errors.fk_Area_id_area}</span>}
                </div>
                <div className="form-group">
                    <label className="required">Serviço Principal</label>
                    <select name="fk_id_servico" value={formData.fk_id_servico} onChange={onChange} required title="Selecione o serviço mais específico deste anúncio.">
                        <option value="">-- Selecione um serviço --</option>
                        {servicos.map(servico => (
                            <option key={servico.id_servico} value={servico.id_servico}>
                                {servico.nome}
                            </option>
                        ))}
                    </select>
                    {errors.fk_id_servico && <span className="field-error">{errors.fk_id_servico}</span>}
                </div>
                <div className="form-group">
                    <label className="required">{textosUI.labelData || 'Data'}</label>
                    <DatePicker selected={dataServico} onChange={(date) => setDataServico(date)} dateFormat="dd/MM/yyyy" minDate={new Date()} className="custom-datepicker-input" title="Informe a data de início do serviço ou a partir de quando você está disponível." />
                </div>

                {/* --- Upload de Imagens --- */}
                <hr style={{ margin: "1rem 0" }} />
                <h3>Imagens do Anúncio (até 5)</h3>
                <div className="form-group">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} title="Envie até 5 imagens que ilustrem seu serviço ou a vaga (fotos de trabalhos anteriores, do local, etc.)." />
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
                {errors.localizacao && <span className="field-error" style={{ display: 'block', marginBottom: '1rem' }}>{errors.localizacao}</span>}
                <button type="button" onClick={() => setIsModalOpen(true)} style={{ marginBottom: '1.5rem' }} title="Defina a cidade onde o serviço será realizado.">
                    {regiaoCity ? 'Alterar Localização' : 'Definir Localização'}
                </button>

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Publicando e Verificando...' : (textosUI.botaoSubmit || 'Publicar')}
                </button>
            </form>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Definir Localização">
                <div className="modal-header-with-help">
                    <h2>Definir Localização</h2>
                    <button onClick={openHelp} className="help-button-modal" title="Ajuda (F1)">
                        <img src={helpIcon} alt="Ajuda" />
                    </button>
                </div>
                <RequiredNotice /> {/* <-- aviso inserido dentro do modal */}
                <Tabs>
                    <Tab label="1. Cidade">
                        <div className="form-group">
                            <label>Estado</label>
                            <select value={regiaoEstadoId} onChange={e => { setRegiaoEstadoId(e.target.value); setRegiaoCity(null); }} required title="Selecione o estado onde o serviço será realizado.">
                                <option value="">-- Selecione --</option>
                                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cidade Central da Região</label>
                            <CityAutocomplete estadoId={regiaoEstadoId} onCitySelect={setRegiaoCity} selectedCity={regiaoCity} title="Digite o nome da cidade onde o serviço será realizado." />
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