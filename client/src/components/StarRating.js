import React from 'react';

const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        stars.push(<span key={`full_${i}`}>&#9733;</span>);
    }

    if (hasHalfStar) {
    }

    const totalStars = 5;
    const emptyStars = totalStars - Math.round(rating);

    // Adiciona estrelas vazias
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<span key={`empty_${i}`}>&#9734;</span>);
    }

    const roundedRating = Math.round(rating * 2) / 2;
    const displayStars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= roundedRating) {
            displayStars.push(<span key={`star_full_${i}`}>&#9733;</span>);
        } else if (i - 0.5 === roundedRating) {
            displayStars.push(<span key={`star_empty_${i}`}>&#9734;</span>);
        } else {
            displayStars.push(<span key={`star_empty_${i}`}>&#9734;</span>);
        }
    }

    const finalStars = [];
    for (let i = 1; i <= 5; i++) {
        finalStars.push(<span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>&#9733;</span>);
    }

    return <div className="star-rating">{finalStars}</div>;
};

export default StarRating;