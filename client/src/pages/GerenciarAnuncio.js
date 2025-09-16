// client/src/pages/GerenciarAnuncio.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const GerenciarAnuncio = () => {
    const { id: idAnuncio } = useParams();
    const [anuncio, setAnuncio] = useState(null);
    const [candidatos, setCandidatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');

    const fetchDados = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [resAnuncio, resCandidatos] = await Promise.all([
                axios.get(`/api/anuncios/${idAnuncio}`),
                axios.get(`/api/anuncios/${idAnuncio}/candidatos`)
            ]);
            setAnuncio(resAnuncio.data);
            setCandidatos(resCandidatos.data);
        } catch (err) {
            setError(err.response?.data?.msg || "Erro ao carregar dados. Você tem permissão para ver esta página?");
        } finally {
            setLoading(false);
        }
    }, [idAnuncio]);

    useEffect(() => {
        fetchDados();
    }, [fetchDados]);

    const handleConfirmar = async (idCandidato) => {
        if (window.confirm("Tem certeza que deseja confirmar este candidato? O anúncio será encerrado.")) {
            try {
                const res = await axios.post(`/api/anuncios/${idAnuncio}/confirmar`, { idCandidatoConfirmado: idCandidato });
                setFeedback(res.data.msg);
                // Re-busca os dados para atualizar o status do anúncio
                fetchDados();
            } catch (err) {
                setError(err.response?.data?.msg || "Não foi possível confirmar o candidato.");
            }
        }
    };

    if (loading) return <div>Carregando gerenciador...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!anuncio) return <div>Anúncio não encontrado.</div>;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1>Gerenciar Anúncio</h1>
            <h2>{anuncio.titulo}</h2>
            <p>Status: <span className={`status-tag ${anuncio.status ? 'active' : 'inactive'}`}>{anuncio.status ? 'Ativo' : 'Encerrado'}</span></p>

            {feedback && <div className="success-message">{feedback}</div>}

            <hr style={{margin: '2rem 0'}} />

            <h3>Lista de Candidatos ({candidatos.length})</h3>
            {candidatos.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {candidatos.map(candidato => (
                        <li key={candidato.id_usuario} className="anuncio-dashboard-card">
                            <div className="card-info">
                                <h4>
                                    <Link to={`/perfil/${candidato.id_usuario}`}>{candidato.nome}</Link>
                                </h4>
                                <p>Candidatou-se em: {new Date(candidato.data_candidatura).toLocaleDateString()}</p>
                            </div>
                            <div className="card-actions">
                                {anuncio.status && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleConfirmar(candidato.id_usuario)}>
                                        Confirmar Serviço
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Ainda não há candidatos para este anúncio.</p>
            )}
        </div>
    );
};

export default GerenciarAnuncio;