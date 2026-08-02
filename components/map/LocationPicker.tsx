'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  showRadius?: boolean;
  radiusKm?: number;
}

function LocationMarker({ lat, lng, onChange, showRadius, radiusKm }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat, lng));

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    setPosition(new L.LatLng(lat, lng));
  }, [lat, lng]);

  return position === null ? null : (
    <>
      <Marker position={position} icon={customIcon} />
      {showRadius && radiusKm && (
        <div className="hidden" /> // In a real app we'd draw a Circle layer here, but simplified for now
      )}
    </>
  );
}

function ChangeView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, showRadius, radiusKm }: LocationPickerProps) {
  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-[var(--border)] z-0 relative">
      <MapContainer center={[lat, lng]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
        <ChangeView lat={lat} lng={lng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} showRadius={showRadius} radiusKm={radiusKm} />
      </MapContainer>
    </div>
  );
}
