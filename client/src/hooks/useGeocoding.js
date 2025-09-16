import { useState } from 'react';
import axios from 'axios';

const nominatimApi = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
    headers: {
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
            const res = await nominatimApi.get(`/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);

            const address = res.data.address;
            const city = address.city || address.town || address.village;
            const state_uf = address.state_code?.toUpperCase();

            if (!city || !state_uf) {
                throw new Error("Não foi possível identificar a cidade/estado.");
            }

            console.log("Geocodificação deu certo:", { city, state_uf });

            setIsGeocoding(false);
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