import React from 'react';
import { Link } from 'react-router-dom'; // <<< 1. Importar o Link
import './AnuncioCard.css';

const AnuncioCard = ({ anuncio }) => {
  const isOferta = anuncio.tipo === 'O';

  return (
    //  <<< 2. Envolver todo o card com o Link
    <Link to={`/anuncio/${anuncio.id_anuncio}`} className="card-link">
      <div className="card">
        <div className="card-image-placeholder">
          <span>IMAGEM TEMPORÁRIA</span>
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
        </div>
      </div>
    </Link>
  );
};

export default AnuncioCard;