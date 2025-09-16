import React from 'react';
import { Link } from 'react-router-dom';
import './AnuncioCard.css';
import mapPinIcon from '../assets/map-pin.svg'; // <<< 1. Importa o ícone
import anuncioPlaceholder from '../assets/anuncio_placeholder.png'; // <<< 1. Importa a imagem padrão
import StarRating from './StarRating'; // <<< Importar o componente de estrelas

const AnuncioCard = ({ anuncio }) => {
    const isOferta = anuncio.tipo === 'O';

    const formatDistance = (distanceMeters) => {
        if (!distanceMeters) return null; // Retorna null se não houver distância
        const distanceKm = distanceMeters / 1000;
        if (distanceKm < 1) {
            return `${Math.round(distanceMeters)} m`; // Mostra em metros se for menos de 1km
        }
        return `${distanceKm.toFixed(1)} km`; // Mostra em km com uma casa decimal
    };

    const distanciaFormatada = formatDistance(anuncio.distancia);

    const imageUrl = anuncio.imagem_capa 
        ? `http://localhost:3001${anuncio.imagem_capa}` 
        : anuncioPlaceholder;

    return (
        <Link to={`/anuncio/${anuncio.id_anuncio}`} className="card-link">
            <div className="card">
                <div className="card-image-container">
                    <img src={imageUrl} alt={anuncio.titulo} className="card-image" />
                </div>
                <div className="card-content">
                    <h3 className="card-title">{anuncio.titulo}</h3>
                    {isOferta ? (
                        <>
                            <p className="card-info"><strong>Contratante:</strong> {anuncio.nome_usuario}</p>
                            <p className="card-info"><strong>Especialização:</strong> {anuncio.nome_area}</p>
                        </>
                    ) : (
                        <>
                            <p className="card-info"><strong>Prestador:</strong> {anuncio.nome_usuario}</p>
                            <p className="card-info"><strong>Serviço Principal:</strong> {anuncio.nome_servico}</p>
                        </>
                    )}
                    {/* A API agora envia 'avaliacao_media' */}
                    {anuncio.avaliacao_media > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <StarRating rating={anuncio.avaliacao_media} />
                        </div>
                    )}

                    {/* <<< 2. Aplica a nova estrutura com a classe e o ícone */}
                    {distanciaFormatada && (
                        <div className="card-location-tag">
                            <img src={mapPinIcon} alt="Ícone de localização" />
                            <span>{distanciaFormatada}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default AnuncioCard;