// client/src/components/AnuncioDashboardCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const AnuncioDashboardCard = ({ anuncio, tipo }) => {
    const postadoEm = new Date(anuncio.data_publicacao || anuncio.data_candidatura).toLocaleDateString('pt-BR');
    
    // Renderiza a versão para "Meus Anúncios Publicados"
    if (tipo === 'publicado') {
        return (
            <div className="anuncio-dashboard-card">
                <div className="card-info">
                    <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                    <p>Publicado em: {postadoEm}</p>
                </div>
                <div className="card-actions">
                    <span className={`status-tag ${anuncio.status ? 'active' : 'inactive'}`}>
                        {anuncio.status ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className={`candidatos-badge ${anuncio.num_candidatos > 0 ? '' : 'none'}`}>
                        {anuncio.num_candidatos} Candidato(s)
                    </div>
                    {/* Futuramente, um botão para gerenciar o anúncio */}
                </div>
            </div>
        );
    }

    // Renderiza a versão para "Minhas Candidaturas"
    if (tipo === 'candidatura') {
        return (
            <div className="anuncio-dashboard-card">
                <div className="card-info">
                    <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                    <p>Candidatou-se em: {postadoEm} | Empresa: {anuncio.nome_empresa}</p>
                </div>
                <div className="card-actions">
                    <span className={`status-tag ${anuncio.status ? 'active' : 'inactive'}`}>
                        {anuncio.status ? 'Ativo' : 'Encerrado'}
                    </span>
                    {/* Futuramente, um botão para retirar a candidatura */}
                </div>
            </div>
        );
    }
    
    return null;
};

export default AnuncioDashboardCard;