import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './CityAutocomplete.css';

const CityAutocomplete = ({ estadoId, onCitySelect, selectedCity, title, disabled }) => {
    const [query, setQuery] = useState(selectedCity ? selectedCity.nome : '');
    const [suggestions, setSuggestions] = useState([]);
    const [isListOpen, setIsListOpen] = useState(false);

    useEffect(() => {
        setQuery(selectedCity ? selectedCity.nome : '');
    }, [selectedCity]);

    const handleCitySelect = (city) => {
        setIsListOpen(false);
        setSuggestions([]);
        onCitySelect(city);
    };

    const fetchSuggestions = useCallback(async () => {
        if (query.length < 2 || !estadoId || (selectedCity && query === selectedCity.nome)) {
            setSuggestions([]);
            return;
        }
        setIsListOpen(true);

        try {
            const res = await api.get(`/api/dados/cidades?q=${query}&estadoId=${estadoId}`);
            setSuggestions(res.data);
        } catch (error) {
            console.error("Erro ao buscar sugestões de cidade:", error);
            setSuggestions([]);
        }
      
    }, [query, estadoId, selectedCity]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchSuggestions]);

    return (
        <div className="autocomplete-container">
            <input
                type="text"
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    if (e.target.value === '') {
                        onCitySelect(null);
                    }
                }}
                onFocus={() => setIsListOpen(true)}
                onBlur={() => setTimeout(() => setIsListOpen(false), 200)}
                placeholder="Digite o nome da cidade"
                disabled={!estadoId || disabled}
                title={title}
            />
            {isListOpen && suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map(city => (
                        <li key={city.id_cidade} onMouseDown={() => handleCitySelect(city)}>
                            {city.nome}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CityAutocomplete;