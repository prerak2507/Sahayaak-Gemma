'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Satellite tiles.
 *
 * Esri World Imagery is the default because it needs no API key. The previous
 * value was a Google Maps tile URL with a live key inlined in the source, which
 * would have leaked on the first public push.
 */
const SATELLITE_TILE_URL =
  process.env.NEXT_PUBLIC_SATELLITE_TILE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const SATELLITE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_SATELLITE_ATTRIBUTION ||
  '&copy; Esri, Maxar, Earthstar Geographics';


interface Anomaly {
  id: string;
  title: string;
  category: string;
  confidence: number;
  lat: number;
  lng: number;
  description: string;
}

interface SatelliteMapProps {
  anomalies: Anomaly[];
  selectedAnomaly: Anomaly | null;
  onSelectAnomaly: (anomaly: Anomaly) => void;
}

const createSatelliteRadarPin = (confidence: number) => {
  const color = '#38BDF8'; // Sky Blue
  
  const html = `<div class="relative w-8 h-8 rounded-full flex items-center justify-center border-2 border-sky-400/80 bg-sky-950/20 animate-pulse">
    <div class="w-3 h-3 rounded-full bg-sky-400"></div>
    <div class="absolute inset-0 rounded-full animate-ping opacity-45 bg-sky-400"></div>
  </div>`;
  
  return new L.DivIcon({
    html,
    className: 'satellite-radar-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function SatelliteMap({ anomalies, selectedAnomaly, onSelectAnomaly }: SatelliteMapProps) {
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[23.03, 72.56]} 
        zoom={12} 
        zoomControl={false}
        className="w-full h-full z-0"
      >
        {/* Esri World Imagery by default: free, keyless, and good enough for a
            satellite backdrop. A Google Maps key used to be hardcoded here,
            which would have been published the moment this repository went
            public. Set NEXT_PUBLIC_SATELLITE_TILE_URL to use a different
            provider. */}
        <TileLayer attribution={SATELLITE_ATTRIBUTION} url={SATELLITE_TILE_URL} />

        {anomalies.map((node) => (
          <Marker 
            key={node.id} 
            position={[node.lat, node.lng]}
            icon={createSatelliteRadarPin(node.confidence)}
            eventHandlers={{
              click: () => onSelectAnomaly(node),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-850 flex flex-col gap-1.5 min-w-[200px]">
                <h4 className="font-extrabold text-xs text-white leading-tight">{node.title}</h4>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Confidence Score:</span>
                  <span className="font-black text-sky-400">{node.confidence}%</span>
                </div>
                <button 
                  onClick={() => onSelectAnomaly(node)}
                  className="mt-2 w-full py-1.5 bg-sky-700 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                >
                  Inspect Anomaly
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legends */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Satellite Detection Node</span>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
          </span>
          <span>AI Anomaly Detected (Pulsing)</span>
        </div>
      </div>
    </div>
  );
}
