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
                    <h3><Link to={`/anuncios/gerenciar/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
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

    // Renderiza a versão para "Confirmados"
    if (tipo === 'confirmado') {
        const dataConfirmacao = new Date(anuncio.data_confirmacao).toLocaleDateString('pt-BR');
        
        // Se o card mostrar um trabalho que EU CONSEGUI
        if (anuncio.nome_empresa) {
            return (
                <div className="anuncio-dashboard-card">
                    <div className="card-info">
                        <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                        <p>Confirmado em: {dataConfirmacao} | Contratante: {anuncio.nome_empresa}</p>
                    </div>
                    {/* Futuramente um botão de 'Avaliar' */}
                </div>
            );
        }

        // Se o card mostrar um trabalho que EU PUBLIQUEI e confirmei alguém
        if (anuncio.nome_candidato) {
            return (
                <div className="anuncio-dashboard-card">
                    <div className="card-info">
                        <h3><Link to={`/anuncio/${anuncio.id_anuncio}`}>{anuncio.titulo}</Link></h3>
                        <p>Confirmado em: {dataConfirmacao} | Candidato selecionado: {anuncio.nome_candidato}</p>
                    </div>
                    {/* Futuramente um botão de 'Avaliar' */}
                </div>
            );
        }
    }
    
    return null;
};

export default AnuncioDashboardCard;