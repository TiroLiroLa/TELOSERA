import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

const parseLocation = (locationString) => {
    if (!locationString || typeof locationString !== 'string') return null;
    const coordsMatch = locationString.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!coordsMatch || coordsMatch.length < 3) return null;

    return [parseFloat(coordsMatch[2]), parseFloat(coordsMatch[1])];
};

const getZoomLevel = (radiusKm) => {
    if (radiusKm <= 1) return 15;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 50) return 10;
    if (radiusKm <= 100) return 9;
    if (radiusKm <= 500) return 7;
    return 6;
};

const StaticMap = ({ location, raio }) => {
    const position = parseLocation(location);

    if (!position) {
        return (
            <div style={{
                height: '250px',
                width: '100%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#888'
            }}>
                Localização não definida.
            </div>
        );
    }

    const radiusInMeters = raio * 1000;
    const dynamicZoom = getZoomLevel(raio);

    return (
        <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
                center={position}
                zoom={dynamicZoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                dragging={true}
                zoomControl={true}
                doubleClickZoom={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
            </MapContainer>
        </div>
    );
};

export default StaticMap;