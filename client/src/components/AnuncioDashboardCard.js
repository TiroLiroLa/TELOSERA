import React from 'react';
import { Link } from 'react-router-dom';

const AnuncioDashboardCard = ({ anuncio, tipo, onAvaliarClick }) => {
    const dataFormatada = new Date(anuncio.data_confirmacao || anuncio.data_candidatura || anuncio.data_publicacao).toLocaleDateString('pt-BR');

    if (tipo === 'publicado') {
        return (
            <div className="anuncio-dashboard-card">
                <div className="card-info">
                    <h3><Link to={`/anuncios/gerenciar/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                    <p>Publicado em: {dataFormatada}</p>
                </div>
                <div className="card-actions">
                    <span className={`status-tag ${anuncio.status ? 'active' : 'inactive'}`}>{anuncio.status ? 'Ativo' : 'Inativo'}</span>
                    <Link to={`/anuncios/gerenciar/${anuncio.id_anuncio}`} className={`candidatos-badge ${anuncio.num_candidatos > 0 ? '' : 'none'}`}>
                        {anuncio.num_candidatos} Candidato(s)
                    </Link>
                </div>
            </div>
        );
    }

    if (tipo === 'candidatura') {
        return (
            <div className="anuncio-dashboard-card">
                <div className="card-info">
                    <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                    <p>Candidatou-se em: {dataFormatada} | Publicado por: {anuncio.nome_empresa || anuncio.nome_outro_usuario}</p>
                </div>
                <div className="card-actions">
                    <span className={`status-tag ${anuncio.status ? 'active' : 'inactive'}`}>{anuncio.status ? 'Ativo' : 'Encerrado'}</span>
                </div>
            </div>
        );
    }

    if (tipo === 'confirmado') {
        const label = anuncio.papel_outro_usuario === 'candidato' ? 'Candidato selecionado' : 'Contratante';

        return (
            <div className="anuncio-dashboard-card">
                <div className="card-info">
                    <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                    <p>Confirmado em: {dataFormatada} | {label}: {anuncio.nome_outro_usuario}</p>
                </div>
                <div className="card-actions">
                    {anuncio.avaliacao_realizada ? (
                        <button className="btn" disabled>Avaliado</button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => onAvaliarClick(anuncio)}>Avaliar</button>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default AnuncioDashboardCard;