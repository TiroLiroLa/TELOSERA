import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { cpf as cpfValidator, cnpj as cnpjValidator } from 'cpf-cnpj-validator';
import './Cadastro.css';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import CityAutocomplete from '../components/CityAutocomplete';
import { Tabs, Tab } from '../components/Tabs';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const Cadastro = () => {
    const [etapa, setEtapa] = useState(1);
    const [tipoUsuario, setTipoUsuario] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        identificador: '',
        telefone: '',
        rua: '',
        numero: '',
        complemento: '',
        cep: '',
        raio_atuacao: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [estados, setEstados] = useState([]);
    const [enderecoEstadoId, setEnderecoEstadoId] = useState('');
    const [enderecoCity, setEnderecoCity] = useState(null);
    const [regiaoEstadoId, setRegiaoEstadoId] = useState('');
    const [regiaoCity, setRegiaoCity] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState('');
    const [addressFieldsDisabled, setAddressFieldsDisabled] = useState(false);


    useEffect(() => {
        const fetchEstados = async () => {
            try {
                const res = await axios.get('/api/dados/estados');
                setEstados(res.data);
            } catch (err) {
                console.error("Erro ao buscar estados", err);
            }
        };
        fetchEstados();
    }, []);

    useEffect(() => {
        const syncMapToCity = async () => {
            if (regiaoCity && regiaoEstadoId) {
                const estado = estados.find(e => e.id_estado === parseInt(regiaoEstadoId));
                if (estado) {
                    try {
                        // A lógica de geocoding agora é feita diretamente aqui
                        const query = `city=${encodeURIComponent(regiaoCity.nome)}&state=${encodeURIComponent(estado.uf)}&country=Brazil`;
                        // Usamos o axios diretamente, não mais o hook
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
    }, [regiaoCity, regiaoEstadoId, estados]); // Adiciona 'estados' à dependência

    const onChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name] || errors.api) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                delete newErrors.api;
                return newErrors;
            });
        }
    };

    const handleCepLookup = async () => {
        const cep = formData.cep.replace(/\D/g, ''); // Remove tudo que não for dígito
        if (cep.length !== 8) {
            setCepError('CEP deve conter 8 dígitos.');
            return;
        }

        setIsCepLoading(true);
        setCepError('');
        setAddressFieldsDisabled(false);

        try {
            // Chama a API ViaCEP
            const viaCepResponse = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

            if (viaCepResponse.data.erro) {
                throw new Error('CEP não encontrado.');
            }

            const { logradouro, localidade, uf } = viaCepResponse.data;

            if (!localidade || !uf) {
                throw new Error('Dados de Cidade/Estado não retornados pelo CEP.');
            }

            // Agora, busca os IDs da nossa própria API com os dados retornados
            const ourApiResponse = await axios.get(`/api/dados/localizacao-por-nome?uf=${uf}&cidade=${localidade}`);
            const { id_estado, id_cidade, nome_cidade } = ourApiResponse.data;

            // Preenche o formulário e os estados
            setFormData(prev => ({ ...prev, rua: logradouro }));
            setEnderecoEstadoId(id_estado);
            setEnderecoCity({ id_cidade, nome: nome_cidade });

            // Trava os campos
            setAddressFieldsDisabled(true);

        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setCepError('CEP inválido ou não encontrado. Por favor, preencha manualmente.');
            handleClearAddress(false); // Chama a função para limpar, mas sem limpar o CEP
        } finally {
            setIsCepLoading(false);
        }
    };

    // <<< 3. NOVA FUNÇÃO PARA LIBERAR OS CAMPOS
    const handleClearAddress = (clearCep = true) => {
        setFormData(prev => ({
            ...prev,
            rua: '',
            numero: '',
            complemento: '',
            // Só limpa o CEP se for chamado pelo botão do usuário
            cep: clearCep ? '' : prev.cep
        }));
        setEnderecoEstadoId('');
        setEnderecoCity(null);
        setAddressFieldsDisabled(false);
        // Limpa o erro do CEP ao limpar o endereço
        if (cepError) setCepError('');
    };

    const validateForm = () => {
        const newErrors = {};
        const { nome, email, senha, confirmarSenha, identificador } = formData;

        if (!nome.trim()) newErrors.nome = 'Nome / Razão Social é obrigatório.';
        if (!email.trim()) newErrors.email = 'E-mail é obrigatório.';
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) newErrors.email = 'Formato de e-mail inválido.';
        }

        const isPasswordStrong = senha.length >= 6 && /(?=.*[A-Z])/.test(senha) && /(?=.*[0-9])/.test(senha);
        if (!isPasswordStrong) {
            newErrors.senha = "A senha não atende a todos os critérios de segurança.";
        }

        if (!identificador.trim()) {
            newErrors.identificador = 'CPF / CNPJ é obrigatório.';
        } else {
            if (tipoUsuario === 'P' && !cpfValidator.isValid(identificador)) {
                newErrors.identificador = 'CPF inválido.';
            }
            if (tipoUsuario === 'E' && !cnpjValidator.isValid(identificador)) {
                newErrors.identificador = 'CNPJ inválido.';
            }
        }

        if (!enderecoCity) newErrors.localizacao = 'É necessário definir um endereço (Estado e Cidade).';
        if (!regiaoCity) newErrors.localizacao = 'É necessário definir uma região de atuação (Estado e Cidade).';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const dadosParaEnviar = {
            ...formData,
            tipo_usuario: tipoUsuario,
            fk_id_cidade_endereco: enderecoCity?.id_cidade,
            localizacao: location,
            fk_id_cidade_regiao: regiaoCity?.id_cidade,
        };

        try {
            const res = await axios.post('/api/users/register', dadosParaEnviar);
            setSuccessMessage(res.data.msg);
            setEtapa(3);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Ocorreu um erro. Tente novamente.';
            const newApiErrors = {};
            if (errorMsg.includes('e-mail')) {
                newApiErrors.email = errorMsg;
            } else if (errorMsg.includes('identificador')) {
                newApiErrors.identificador = errorMsg;
            } else {
                newApiErrors.api = errorMsg;
            }
            setErrors(newApiErrors);
        }
    };

    const handleTipoSelect = (tipo) => { setTipoUsuario(tipo); setEtapa(2); };
    const handleCreateCity = async (cityName, estadoId) => {
        if (!estadoId) {
            alert("Por favor, selecione um estado primeiro.");
            return null;
        }
        try {
            const res = await axios.post('/api/dados/cidades', { nome: cityName, fk_id_estado: estadoId });
            return res.data;
        } catch (error) {
            alert("Erro ao criar nova cidade.");
            return null;
        }
    };
    const onLocationSelect = (latlng) => { setLocation(latlng); };

    const renderEtapa1 = () => (
        <div className="tipo-conta-escolha">
            <button className="tipo-conta-btn" onClick={() => handleTipoSelect('P')}>
                <h3>Sou Prestador de Serviço</h3>
                <p>Ofereça seus serviços e encontre oportunidades.</p>
            </button>
            <button className="tipo-conta-btn" onClick={() => handleTipoSelect('E')}>
                <h3>Sou uma Empresa</h3>
                <p>Encontre os melhores profissionais para suas obras.</p>
            </button>
        </div>
    );

    const renderEtapa2 = () => {
        const idLabel = tipoUsuario === 'P' ? 'CPF' : 'CNPJ';
        const idPlaceholder = tipoUsuario === 'P' ? '000.000.000-00' : '00.000.000/0000-00';
        const localizacaoDefinida = enderecoCity || regiaoCity;

        return (
            <form onSubmit={onSubmit} className="cadastro-form" noValidate>
                <button type="button" className="back-button" onClick={() => setEtapa(1)}>&larr; Voltar</button>
                {errors.api && <div className="error-message">{errors.api}</div>}

                <div className="form-group">
                    <label htmlFor="nome" className="required">Nome Completo / Razão Social</label>
                    <input type="text" id="nome" name="nome" value={formData.nome} onChange={onChange} />
                    {errors.nome && <span className="field-error">{errors.nome}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="identificador" className="required">{idLabel}</label>
                    <input type="text" id="identificador" name="identificador" value={formData.identificador} onChange={onChange} placeholder={idPlaceholder} />
                    {errors.identificador && <span className="field-error">{errors.identificador}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="required">E-mail</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={onChange} />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="telefone">Telefone</label>
                    <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={onChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="senha" className="required">Senha</label>
                    <PasswordInput
                        id="senha"
                        name="senha"
                        value={formData.senha}
                        onChange={onChange}
                        required
                    />
                    <PasswordStrengthMeter password={formData.senha} />
                    {errors.senha && <span className="field-error">{errors.senha}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="confirmarSenha" className="required">Confirmar Senha</label>
                    <PasswordInput
                        id="confirmarSenha"
                        name="confirmarSenha"
                        value={formData.confirmarSenha}
                        onChange={onChange}
                        required
                    />
                    {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
                </div>

                <hr style={{ margin: "1rem 0" }} />
                <h3>Endereço Principal & Região de Atuação</h3>
                {localizacaoDefinida ? (
                    <div className="summary-box">
                        Localização definida em: <strong>{enderecoCity ? enderecoCity.nome : regiaoCity.nome}</strong>. Raio: <strong>{formData.raio_atuacao || 'N/D'} km</strong>
                    </div>
                ) : (
                    <p>Clique no botão abaixo para definir seu endereço e área de atuação.</p>
                )}
                {errors.localizacao && <span className="field-error" style={{ display: 'block', marginBottom: '1rem' }}>{errors.localizacao}</span>}
                <button type="button" onClick={() => setIsModalOpen(true)} style={{ marginBottom: '1.5rem' }}>
                    {localizacaoDefinida ? 'Alterar Endereço e Região' : 'Definir Endereço e Região'}
                </button>

                <button type="submit" className="btn btn-primary">Criar Conta</button>
            </form>
        );
    };

    const renderEtapa3 = () => (
        <div>
            <h3>Quase lá!</h3>
            <p>{successMessage}</p>
            <p>Enviamos um link de ativação para o seu endereço de e-mail.</p>
        </div>
    );

    return (
        <div className="cadastro-page-container">
            <div className="cadastro-box">
                <h2>Crie sua conta {tipoUsuario && `(${tipoUsuario === 'P' ? 'Prestador' : 'Empresa'})`}</h2>
                {etapa === 1 && renderEtapa1()}
                {etapa === 2 && renderEtapa2()}
                {etapa === 3 && renderEtapa3()}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h2>Endereço e Região de Atuação</h2>

                    <Tabs>
                        <Tab label="1. Endereço">
                            <p>Digite seu CEP para preenchimento automático do endereço.</p>
                            <div className="form-group">
                                <label className="required">CEP</label>
                                {/* <<< 4. INPUT DE CEP ATUALIZADO */}
                                <input
                                    type="text"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={onChange}
                                    onBlur={handleCepLookup} // <<< A MÁGICA ACONTECE AQUI
                                    maxLength="9" // Ex: 88888-888
                                />
                                {isCepLoading && <small>Buscando...</small>}
                                {cepError && <span className="field-error">{cepError}</span>}
                            </div>
                            {addressFieldsDisabled && (
                                <button type="button" onClick={() => handleClearAddress(true)} style={{ marginBottom: '1rem' }}>
                                    Limpar/Editar Endereço
                                </button>
                            )}

                            <div className="form-group">
                                <label className="required">Logradouro</label>
                                <input type="text" name="rua" value={formData.rua} onChange={onChange} disabled={addressFieldsDisabled} />
                            </div>
                            <div className="form-group">
                                <label className="required">Número</label>
                                <input type="text" name="numero" value={formData.numero} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Complemento</label>
                                <input type="text" name="complemento" value={formData.complemento} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label className="required">Estado</label>
                                <select value={enderecoEstadoId} onChange={e => { setEnderecoEstadoId(e.target.value); setEnderecoCity(null); }} required disabled={addressFieldsDisabled}>
                                    <option value="">-- Selecione --</option>
                                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="required">Cidade</label>
                                <CityAutocomplete estadoId={enderecoEstadoId} onCitySelect={setEnderecoCity} onCityCreate={(cityName) => handleCreateCity(cityName, enderecoEstadoId)} selectedCity={enderecoCity} disabled={addressFieldsDisabled} />
                            </div>
                        </Tab>
                        <Tab label="2. Região de Atuação">
                            <p>Selecione a cidade e, se desejar, ajuste o pino no mapa.</p>

                            <div className="form-group">
                                <label className="required">Estado da Região</label>
                                <select value={regiaoEstadoId} onChange={e => { setRegiaoEstadoId(e.target.value); setRegiaoCity(null); }} required>
                                    <option value="">-- Selecione --</option>
                                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="required">Cidade Central da Região</label>
                                <CityAutocomplete estadoId={regiaoEstadoId} onCitySelect={setRegiaoCity} onCityCreate={handleCreateCity} selectedCity={regiaoCity} />
                            </div>

                            <div className="form-group">
                                <label>Ponto Central de Atuação</label>
                                <div style={{ height: '250px' }}>
                                    {/* A prop 'onLocationSelect' agora aponta para a função simplificada */}
                                    <LocationPicker onLocationSelect={onLocationSelect} initialPosition={location} radiusKm={formData.raio_atuacao} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="required">Raio de Atuação (km)</label>
                                <input type="number" name="raio_atuacao" value={formData.raio_atuacao} onChange={onChange} />
                            </div>
                        </Tab>
                    </Tabs>

                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-primary" style={{ marginTop: '2rem' }}>
                        Confirmar e Fechar
                    </button>
                </Modal>
            </div>
        </div>
    );
};

export default Cadastro;