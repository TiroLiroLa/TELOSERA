import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

// <<< NOVA FUNÇÃO: Calcula o nível de zoom a partir do raio em km
const getZoomLevel = (radiusKm) => {
    // Esta é uma aproximação logarítmica. Os valores foram ajustados por tentativa e erro.
    // Quanto maior o raio, menor o nível de zoom.
    if (radiusKm <= 1) return 15;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 50) return 10;
    if (radiusKm <= 100) return 9;
    if (radiusKm <= 500) return 7;
    return 6; // Para raios muito grandes
};

// Função para extrair latitude e longitude da string 'POINT(lng lat)' do PostGIS
const parseLocation = (locationString) => {
    if (!locationString) return null;
    const coords = locationString.replace('POINT(', '').replace(')', '').split(' ');
    // Retorna no formato [latitude, longitude] que o Leaflet espera
    return [parseFloat(coords[1]), parseFloat(coords[0])]; 
};

const StaticMap = ({ location, raio }) => {
    const position = parseLocation(location);

    if (!position) {
        return <div>Localização não disponível.</div>;
    }

    // O raio no Leaflet Circle é em metros, então convertemos de km para m
    const radiusInMeters = raio * 1000;

    const dynamicZoom = getZoomLevel(raio);

    return (
        <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer 
                center={position} 
                zoom={dynamicZoom} // <<< Usa a variável de zoom dinâmico
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                dragging={false}
                zoomControl={true}
                doubleClickZoom={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* <Marker position={position} /> */}
                <Circle 
                    center={position} 
                    radius={radiusInMeters} 
                    pathOptions={{ color: 'blue', fillColor: 'blue' }} 
                />
            </MapContainer>
        </div>
    );
};

export default StaticMap;