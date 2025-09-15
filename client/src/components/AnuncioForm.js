import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnuncioForm = ({ onAnuncioCriado }) => {
  // Estados para armazenar os dados dos dropdowns
  const [areas, setAreas] = useState([]);
  const [servicos, setServicos] = useState([]);

  // Estado do formul�rio, agora com os campos que faltavam
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'O', // 'O' -> Oferta, 'S' -> Servi�o
    fk_Area_id_area: '',
    fk_id_servico: '',
  });

  // useEffect para buscar os dados das �reas e servi�os quando o componente � montado
  useEffect(() => {
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
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  const { titulo, descricao, tipo, fk_Area_id_area, fk_id_servico } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    // Valida��o para garantir que uma op��o foi selecionada
    if (!fk_Area_id_area || !fk_id_servico) {
        alert("Por favor, selecione uma Área e um Serviço.");
        return;
    }
    try {
      const res = await axios.post('/api/anuncios', formData);
      alert('Anúncio criado com sucesso!');
      onAnuncioCriado(res.data);
      // Reseta o formul�rio
      setFormData({ titulo: '', descricao: '', tipo: 'O', fk_Area_id_area: '', fk_id_servico: '' });
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      alert('Erro ao criar anúncio.');
    }
  };

  return (
    <div className="form-container">
      <h2>Criar Novo Anúncio</h2>
      <form onSubmit={onSubmit}>
        <input type="text" name="titulo" value={titulo} onChange={onChange} placeholder="Título do Anúncio" required />
        <textarea name="descricao" value={descricao} onChange={onChange} placeholder="Descrição detalhada" required />
        
        <select name="fk_Area_id_area" value={fk_Area_id_area} onChange={onChange} required>
            <option value="">-- Selecione a Area de Atuação --</option>
            {areas.map(area => (
                <option key={area.id_area} value={area.id_area}>{area.nome}</option>
            ))}
        </select>
        
        <select name="fk_id_servico" value={fk_id_servico} onChange={onChange} required>
            <option value="">-- Selecione o Tipo de Serviço --</option>
            {servicos.map(servico => (
                <option key={servico.id_servico} value={servico.id_servico}>{servico.nome}</option>
            ))}
        </select>

        <div className="radio-group">
          <p>Tipo de Anúncio:</p>
          <label>
            <input type="radio" name="tipo" value="O" checked={tipo === 'O'} onChange={onChange} /> Oferta de Vaga
          </label>
          <label>
            <input type="radio" name="tipo" value="S" checked={tipo === 'S'} onChange={onChange} /> Oferecer Serviço
          </label>
        </div>
        <button type="submit">Publicar Anúncio</button>
      </form>
    </div>
  );
};

export default AnuncioForm;