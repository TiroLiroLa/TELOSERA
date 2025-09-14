import React, { useState } from 'react';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';
import Modal from '../components/Modal'; // <<< Importar Modal

const Cadastro = () => {
  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '', cpf: '',
    tipo_usuario: 'P', telefone: '', rua: '', numero: '',
    complemento: '', cidade: '', estado: '', cep: '',
    raio_atuacao: '', // <<< Adicionado ao estado principal
  });
  
  // Estado separado para a localização (latitude e longitude)
  const [location, setLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // <<< Estado para o modal

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onLocationSelect = (latlng) => {
    setLocation(latlng);
    console.log("Localização selecionada:", latlng);
    // Futuramente, poderíamos usar uma API de geocodificação reversa
    // para preencher os campos de endereço automaticamente.
  };

  const handleConfirmLocation = () => {
    if (!location) {
      alert("Por favor, clique no mapa para selecionar sua localização.");
      return;
    }
    setIsModalOpen(false); // Fecha o modal e mantém a localização salva
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (formData.senha !== formData.confirmarSenha) {
      return alert('As senhas não coincidem!');
    }
    
    const dadosParaEnviar = { ...formData, localizacao: location };

    try {
      await axios.post('/api/users/register', dadosParaEnviar);
      alert('Cadastro realizado com sucesso!');
    } catch (err) {
      alert(`Erro no cadastro: ${err.response?.data?.msg || err.message}`);
    }
  };

  return (
    <div className="container" style={{maxWidth: '700px', margin: 'auto'}}>
      <h1>Cadastre-se</h1>
      <form onSubmit={onSubmit}>
        {/* ... campos existentes: nome, email, senha, cpf ... */}
        {/* (Vou omitir o JSX repetido por brevidade, mas eles devem estar aqui) */}
        <input type="text" placeholder="Nome" name="nome" value={formData.nome} onChange={onChange} required />
        <input type="email" placeholder="Email" name="email" value={formData.email} onChange={onChange} required />
        <input type="password" placeholder="Senha" name="senha" value={formData.senha} onChange={onChange} required />
        <input type="password" placeholder="Confirmar Senha" name="confirmarSenha" value={formData.confirmarSenha} onChange={onChange} required />
        <input type="text" placeholder="CPF" name="cpf" value={formData.cpf} onChange={onChange} required />
        <input type="tel" placeholder="Telefone (opcional)" name="telefone" value={formData.telefone} onChange={onChange} />
        
        <h3>Endereço</h3>
        <input type="text" placeholder="Rua" name="rua" value={formData.rua} onChange={onChange} />
        <input type="text" placeholder="Número" name="numero" value={formData.numero} onChange={onChange} />
        <input type="text" placeholder="Complemento" name="complemento" value={formData.complemento} onChange={onChange} />
        <input type="text" placeholder="Cidade" name="cidade" value={formData.cidade} onChange={onChange} />
        <input type="text" placeholder="Estado (UF)" name="estado" value={formData.estado} onChange={onChange} maxLength="2" />
        <input type="text" placeholder="CEP" name="cep" value={formData.cep} onChange={onChange} />

        <div>
          <p>Tipo de Conta:</p>
          <label>
            <input type="radio" name="tipo_usuario" value="P" checked={formData.tipo_usuario === 'P'} onChange={onChange} /> Prestador
          </label>
          <label>
            <input type="radio" name="tipo_usuario" value="E" checked={formData.tipo_usuario === 'E'} onChange={onChange} /> Empresa
          </label>
        </div>

        <div className="regiao-section">
          <h3>Sua Localização Base de Atuação</h3>
          {/* Mostra a localização selecionada ou um prompt para o usuário */}
          {location ? (
            <p>Localização definida: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          ) : (
            <p>Nenhuma localização selecionada.</p>
          )}
          <button type="button" onClick={() => setIsModalOpen(true)}>
            Definir Localização e Raio
          </button>
        </div>

        <input type="submit" value="Registrar" />
      </form>

      {/* Modal para o mapa no cadastro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h2>Defina sua Localização e Raio</h2>
          <LocationPicker 
            onLocationSelect={onLocationSelect} 
            initialPosition={location}
            radiusKm={formData.raio_atuacao}
          />
          <label>
            Raio de Atuação (em km):
            <input 
              type="number" 
              placeholder="Ex: 50" 
              name="raio_atuacao"
              value={formData.raio_atuacao}
              onChange={onChange}
            />
          </label>
          <button type="button" onClick={handleConfirmLocation} style={{marginTop: '1rem'}}>
            Confirmar Localização
          </button>
      </Modal>
    </div>
  );
};

export default Cadastro;