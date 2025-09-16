// client/src/components/AvaliacaoModal.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Modal from './Modal';

const AvaliacaoModal = ({ isOpen, onClose, avaliacaoTarget, onSuccess }) => {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({ comentario: '', nota1: 3, nota2: 3 });
    const [error, setError] = useState('');

    if (!isOpen || !avaliacaoTarget) return null;

    const isEmpresaAvaliando = user?.tipo_usuario === 'E';
    const textosUI = {
        titulo: `Avaliar ${avaliacaoTarget.nome_outro_usuario}`,
        labelNota1: isEmpresaAvaliando ? 'Satisfação com o Serviço' : 'Clareza da Demanda',
        labelNota2: isEmpresaAvaliando ? 'Pontualidade' : 'Pontualidade do Pagamento'
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    const dadosParaEnviar = {
        idConfirmacao: avaliacaoTarget.id_confirmacao, // <<< Esta linha deve existir
        idUsuarioAvaliado: avaliacaoTarget.id_outro_usuario,
        tipoAvaliacao: isEmpresaAvaliando ? 'P' : 'C',
        comentario: formData.comentario,
        nota1: formData.nota1,
        nota2: formData.nota2
    };
    try {
        await axios.post('/api/avaliacoes', dadosParaEnviar);
        onSuccess();
    } catch (err) {
        setError(err.response?.data?.msg || "Erro ao enviar avaliação.");
    }
};

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>{textosUI.titulo}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>{textosUI.labelNota1} (1 a 5)</label>
                    <input type="number" min="1" max="5" value={formData.nota1} onChange={e => setFormData({...formData, nota1: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>{textosUI.labelNota2} (1 a 5)</label>
                    <input type="number" min="1" max="5" value={formData.nota2} onChange={e => setFormData({...formData, nota2: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Comentário</label>
                    <textarea rows="4" value={formData.comentario} onChange={e => setFormData({...formData, comentario: e.target.value})} />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn btn-primary">Enviar Avaliação</button>
            </form>
        </Modal>
    );
};
export default AvaliacaoModal;