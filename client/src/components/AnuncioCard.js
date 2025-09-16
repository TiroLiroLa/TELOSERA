import React from 'react';
import { Link } from 'react-router-dom';
import './AnuncioCard.css';
import mapPinIcon from '../assets/map-pin.svg';
import anuncioPlaceholder from '../assets/anuncio_placeholder.png';
import StarRating from './StarRating';

const AnuncioCard = ({ anuncio }) => {
    const isOferta = anuncio.tipo === 'O';

    const formatDistance = (distanceMeters) => {
        if (!distanceMeters) return null;
        const distanceKm = distanceMeters / 1000;
        if (distanceKm < 1) {
            return `${Math.round(distanceMeters)} m`;
        }
        return `${distanceKm.toFixed(1)} km`;
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
                    {anuncio.avaliacao_media > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <StarRating rating={anuncio.avaliacao_media} />
                        </div>
                    )}
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