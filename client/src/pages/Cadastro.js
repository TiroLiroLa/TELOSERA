import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { cpf as cpfValidator, cnpj as cnpjValidator } from 'cpf-cnpj-validator';
import './Cadastro.css';

// Componentes
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import CityAutocomplete from '../components/CityAutocomplete';
import { Tabs, Tab } from '../components/Tabs';

const Cadastro = () => {
  // --- ESTADOS ---
  const [etapa, setEtapa] = useState(1);
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [errors, setErrors] = useState({}); // Estado de erros como objeto
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

  // Estados para o modal de localização
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [estados, setEstados] = useState([]);
  const [enderecoEstadoId, setEnderecoEstadoId] = useState('');
  const [enderecoCity, setEnderecoCity] = useState(null);
  const [regiaoEstadoId, setRegiaoEstadoId] = useState('');
  const [regiaoCity, setRegiaoCity] = useState(null);

  // --- LÓGICA ---

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

  const onChange = e => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      // Limpa o erro do campo que está sendo editado
      if (errors[name] || errors.api) {
          setErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors[name];
              delete newErrors.api;
              return newErrors;
          });
      }
  };
  
  // Função de validação completa do formulário (antes de enviar)
  const validateForm = () => {
      const newErrors = {};
      const { nome, email, senha, confirmarSenha, identificador } = formData;
      
      // Validações de campos de texto
      if (!nome.trim()) newErrors.nome = 'Nome / Razão Social é obrigatório.';
      if (!email.trim()) newErrors.email = 'E-mail é obrigatório.';
      else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) newErrors.email = 'Formato de e-mail inválido.';
      }

      // Validação de Senha
      if (!senha) newErrors.senha = 'Senha é obrigatória.';
      else if (senha.length < 6) newErrors.senha = 'A senha deve ter no mínimo 6 caracteres.';
      if (senha !== confirmarSenha) newErrors.confirmarSenha = 'As senhas não coincidem.';
      
      // Validação de Identificador
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
      
      // Validação de Localização (verifica se a cidade foi selecionada no modal)
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
          await axios.post('/api/users/register', dadosParaEnviar);
          setEtapa(3);
      } catch (err) {
          const errorMsg = err.response?.data?.msg || 'Ocorreu um erro. Tente novamente.';
          const newApiErrors = {};
          // Mapeia erros específicos da API para os campos corretos
          if (errorMsg.includes('e-mail')) {
              newApiErrors.email = errorMsg;
          } else if (errorMsg.includes('identificador')) {
              newApiErrors.identificador = errorMsg;
          } else {
              newApiErrors.api = errorMsg; // Erro genérico
          }
          setErrors(newApiErrors);
      }
  };

  // --- Funções Auxiliares (sem alteração) ---
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

  // --- RENDERIZAÇÃO ---
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
                  <label htmlFor="nome">Nome Completo / Razão Social</label>
                  <input type="text" id="nome" name="nome" value={formData.nome} onChange={onChange} />
                  {errors.nome && <span className="field-error">{errors.nome}</span>}
              </div>
              <div className="form-group">
                  <label htmlFor="identificador">{idLabel}</label>
                  <input type="text" id="identificador" name="identificador" value={formData.identificador} onChange={onChange} placeholder={idPlaceholder} />
                  {errors.identificador && <span className="field-error">{errors.identificador}</span>}
              </div>
              <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={onChange} />
                  {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={onChange} />
              </div>
              <div className="form-group">
                  <label htmlFor="senha">Senha</label>
                  <input type="password" id="senha" name="senha" value={formData.senha} onChange={onChange} />
                  {errors.senha && <span className="field-error">{errors.senha}</span>}
              </div>
              <div className="form-group">
                  <label htmlFor="confirmarSenha">Confirmar Senha</label>
                  <input type="password" id="confirmarSenha" name="confirmarSenha" value={formData.confirmarSenha} onChange={onChange} />
                  {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
              </div>

              <hr style={{margin: "1rem 0"}} />
              <h3>Endereço Principal & Região de Atuação</h3>
              {localizacaoDefinida ? (
                  <div className="summary-box">
                      Localização definida em: <strong>{enderecoCity ? enderecoCity.nome : regiaoCity.nome}</strong>. Raio: <strong>{formData.raio_atuacao || 'N/D'} km</strong>
                  </div>
              ) : (
                  <p>Clique no botão abaixo para definir seu endereço e área de atuação.</p>
              )}
              {errors.localizacao && <span className="field-error" style={{display: 'block', marginBottom: '1rem'}}>{errors.localizacao}</span>}
              <button type="button" onClick={() => setIsModalOpen(true)} style={{marginBottom: '1.5rem'}}>
                  {localizacaoDefinida ? 'Alterar Endereço e Região' : 'Definir Endereço e Região'}
              </button>
              
              <button type="submit" className="btn btn-primary">Criar Conta</button>
          </form>
      );
  };

  const renderEtapa3 = () => (
      <div>
          <h3>Cadastro Realizado com Sucesso!</h3>
          <p>Seu perfil foi criado. Agora você já pode fazer login na plataforma.</p>
          <Link to="/login" className="btn btn-primary">Ir para o Login</Link>
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
                            <p>Primeiro, preencha seu endereço principal.</p>
                            <div className="form-group">
                                <label>CEP</label>
                                <input type="text" name="cep" value={formData.cep} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Rua</label>
                                <input type="text" name="rua" value={formData.rua} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Número</label>
                                <input type="text" name="numero" value={formData.numero} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Complemento</label>
                                <input type="text" name="complemento" value={formData.complemento} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Estado</label>
                                <select value={enderecoEstadoId} onChange={e => { setEnderecoEstadoId(e.target.value); setEnderecoCity(null); }} required>
                                    <option value="">-- Selecione --</option>
                                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cidade</label>
                                <CityAutocomplete estadoId={enderecoEstadoId} onCitySelect={setEnderecoCity} onCityCreate={handleCreateCity} selectedCity={enderecoCity} />
                            </div>
                        </Tab>
                        <Tab label="2. Região de Atuação">
                              <p>A área onde você oferece seus serviços ou busca profissionais.</p>
                              
                              {/* Seleção de Estado/Cidade para a REGIÃO */}
                            <div className="form-group">
                                <label>Estado da Região</label>
                                <select value={regiaoEstadoId} onChange={e => { setRegiaoEstadoId(e.target.value); setRegiaoCity(null); }} required>
                                    <option value="">-- Selecione --</option>
                                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.uf})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cidade Central da Região</label>
                                <CityAutocomplete estadoId={regiaoEstadoId} onCitySelect={setRegiaoCity} onCityCreate={handleCreateCity} selectedCity={regiaoCity} />
                            </div>
                              
                              {/* Mapa (um pouco menor) e Raio */}
                              <div className="form-group">
                                <label>Ponto Central de Atuação (Clique no mapa)</label>
                                {/* Ajustamos a altura do container do mapa aqui */}
                                <div style={{height: '250px'}}> 
                                    <LocationPicker onLocationSelect={setLocation} initialPosition={location} radiusKm={formData.raio_atuacao} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Raio de Atuação (km)</label>
                                <input type="number" name="raio_atuacao" value={formData.raio_atuacao} onChange={onChange} />
                            </div>
                        </Tab>
                    </Tabs>

                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-primary" style={{marginTop: '2rem'}}>
                        Confirmar e Fechar
                    </button>
                </Modal>
            </div>
        </div>
    );
};

export default Cadastro;