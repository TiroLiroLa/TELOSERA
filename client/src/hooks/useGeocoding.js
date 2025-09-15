import { useState } from 'react';
import axios from 'axios';

// Cria uma instância separada do Axios especificamente para o Nominatim
const nominatimApi = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
    headers: {
        // IMPORTANTE: Troque 'TeloseraApp' pelo nome do seu projeto.
        // O e-mail ajuda eles a contatarem você se necessário.
        'User-Agent': 'TeloseraApp/1.0 (lagostinhadias12@gmail.com)'
    }
});

export const useGeocoding = () => {
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodingError, setGeocodingError] = useState('');

    const findCityAndState = async (latlng) => {
        setIsGeocoding(true);
        setGeocodingError('');
        try {
            // Usa a instância customizada do Axios
            const res = await nominatimApi.get(`/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            
            const address = res.data.address;
            const city = address.city || address.town || address.village;
            const state_uf = address.state_code?.toUpperCase(); // Nominatim retorna 'state_code'

            if (!city || !state_uf) {
                throw new Error("Não foi possível identificar a cidade/estado.");
            }
            
            // Agora, com o nome da cidade e UF, precisamos encontrar os IDs no nosso banco
            // Este passo é complexo e o ideal é ter um endpoint no backend para isso.
            // Por simplicidade aqui, vamos focar no fallback. No mundo real, faríamos outra chamada à nossa API.
            // Vamos simular um sucesso e um erro.
            console.log("Geocodificação deu certo:", { city, state_uf });
            
            // No caso real, aqui você chamaria sua API para obter o ID da cidade
            // Ex: const cityData = await axios.get(`/api/dados/cidadePorNome?nome=${city}&uf=${state_uf}`);
            // return cityData.data.id_cidade;

            setIsGeocoding(false);
            // Por enquanto, retornamos os nomes para o fallback
            return { success: true, city: city, state_uf: state_uf }; 
            
        } catch (error) {
            console.error("Erro no reverse geocoding:", error);
            setGeocodingError("Não foi possível obter a localização automaticamente. Por favor, insira manualmente.");
            setIsGeocoding(false);
            return { success: false };
        }
    };

    return { isGeocoding, geocodingError, findCityAndState };
};