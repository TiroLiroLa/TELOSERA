import React from 'react';

const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    // Adiciona estrelas cheias
    for (let i = 0; i < fullStars; i++) {
        stars.push(<span key={`full_${i}`}>&#9733;</span>); // Estrela cheia
    }

    // Adiciona a meia estrela, se houver
    if (hasHalfStar) {
        // Não há um caractere de meia estrela universal, então usamos uma técnica de sobreposição ou um SVG.
        // Por simplicidade, vamos arredondar para cima ou para baixo, mas o ideal seria usar um ícone.
        // Para este exemplo, vamos arredondar para a estrela mais próxima.
    }
    
    // Calcula o número total de estrelas a serem exibidas (cheias + vazias)
    const totalStars = 5;
    const emptyStars = totalStars - Math.round(rating);

    // Adiciona estrelas vazias
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<span key={`empty_${i}`}>&#9734;</span>); // Estrela vazia
    }
    
    // Lógica de arredondamento mais simples e visualmente eficaz:
    const roundedRating = Math.round(rating * 2) / 2; // Arredonda para 0, 0.5, 1, 1.5, etc.
    const displayStars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= roundedRating) {
            displayStars.push(<span key={`star_full_${i}`}>&#9733;</span>);
        } else if (i - 0.5 === roundedRating) {
             // Meia estrela é complexo, vamos manter simples por enquanto
             displayStars.push(<span key={`star_empty_${i}`}>&#9734;</span>);
        } else {
            displayStars.push(<span key={`star_empty_${i}`}>&#9734;</span>);
        }
    }
    // Simplificando ainda mais: apenas estrelas cheias e vazias.
    const finalStars = [];
    for (let i = 1; i <= 5; i++) {
        finalStars.push(<span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>&#9733;</span>);
    }

    return <div className="star-rating">{finalStars}</div>;
};

export default StarRating;