import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function LocationMarker({ onPositionChange }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng); // Envia a nova posição para o componente pai
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

const LocationPicker = ({ onLocationSelect }) => {
  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
      <MapContainer center={[-25.0945, -50.1633]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onPositionChange={onLocationSelect} />
      </MapContainer>
      <small>Clique no mapa para definir a sua localização base.</small>
    </div>
  );
};

export default LocationPicker;