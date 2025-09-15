import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './CityAutocomplete.css';

const CityAutocomplete = ({ estadoId, onCitySelect, onCityCreate, selectedCity }) => {
    // O estado 'query' agora reflete a cidade selecionada no componente pai.
    const [query, setQuery] = useState(selectedCity ? selectedCity.nome : '');
    const [suggestions, setSuggestions] = useState([]);
    const [isListOpen, setIsListOpen] = useState(false);
    const [showCreateButton, setShowCreateButton] = useState(false);

    // Sincroniza o input se a cidade selecionada no pai mudar
    // (Ex: pela geocodificação ou resetando o formulário)
    useEffect(() => {
        setQuery(selectedCity ? selectedCity.nome : '');
    }, [selectedCity]);

    const handleCitySelect = (city) => {
        setIsListOpen(false); // Fecha a lista
        setSuggestions([]);
        onCitySelect(city); // Informa o pai da nova seleção
    };

    const handleCreateCity = async () => {
        const newCity = await onCityCreate(query);
        if (newCity) {
            handleCitySelect(newCity);
        }
    };
    
    // A lógica de busca permanece a mesma
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
                    // Se o usuário apaga o texto, deselecionamos a cidade
                    if (e.target.value === '') {
                        onCitySelect(null);
                    }
                }}
                onFocus={() => setIsListOpen(true)}
                onBlur={() => setTimeout(() => setIsListOpen(false), 200)} // Delay para permitir o clique na lista
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