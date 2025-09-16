import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './CityAutocomplete.css';

const CityAutocomplete = ({ estadoId, onCitySelect, onCityCreate, selectedCity }) => {
    const [query, setQuery] = useState(selectedCity ? selectedCity.nome : '');
    const [suggestions, setSuggestions] = useState([]);
    const [isListOpen, setIsListOpen] = useState(false);
    const [showCreateButton, setShowCreateButton] = useState(false);

    useEffect(() => {
        setQuery(selectedCity ? selectedCity.nome : '');
    }, [selectedCity]);

    const handleCitySelect = (city) => {
        setIsListOpen(false);
        setSuggestions([]);
        onCitySelect(city);
    };

    const handleCreateCity = async () => {
        const newCity = await onCityCreate(query);
        if (newCity) {
            handleCitySelect(newCity);
        }
    };

    const fetchSuggestions = useCallback(async () => {
        if (query.length < 2 || !estadoId || (selectedCity && query === selectedCity.nome)) {
            setSuggestions([]);
            setShowCreateButton(false);
            return;
        }
        setIsListOpen(true);
        const res = await axios.get(`/api/dados/cidades?q=${query}&estadoId=${estadoId}`);
        setSuggestions(res.data);

        const exactMatch = res.data.find(c => c.nome.toLowerCase() === query.toLowerCase());
        setShowCreateButton(!exactMatch);

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
                disabled={!estadoId}
            />
            {isListOpen && (
                <>
                    {suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map(city => (
                                <li key={city.id_cidade} onMouseDown={() => handleCitySelect(city)}>
                                    {city.nome}
                                </li>
                            ))}
                        </ul>
                    )}
                    {query.length >= 2 && suggestions.length === 0 && showCreateButton && (
                        <div className="suggestions-list">
                            <button type="button" onMouseDown={handleCreateCity} className="create-city-btn">
                                Criar nova cidade: "{query}"
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CityAutocomplete;