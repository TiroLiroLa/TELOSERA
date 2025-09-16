import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';

function MapEvents({ onPositionChange, position, radiusKm }) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  if (!position) {
    return null;
  }

  const radiusMeters = radiusKm > 0 ? radiusKm * 1000 : 0;

  return (
    <>
      <Marker position={position}></Marker>
      {radiusMeters > 0 && <Circle center={position} radius={radiusMeters} />}
    </>
  );
}

const LocationPicker = ({ onLocationSelect, initialPosition, radiusKm }) => {
  const [position, setPosition] = useState(initialPosition);

  const handlePositionChange = (latlng) => {
    setPosition(latlng);
    onLocationSelect(latlng);
  };

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
      <MapContainer center={position || [-25.0945, -50.1633]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents
          onPositionChange={handlePositionChange}
          position={position}
          radiusKm={radiusKm}
        />
      </MapContainer>
      <small>Clique no mapa para definir a sua localização base.</small>
    </div>
  );
};

export default LocationPicker;