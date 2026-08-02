'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Pulsing Markers
const createPredictivePin = (prob: number) => {
  const color = prob >= 80 ? '#EF4444' : prob >= 60 ? '#F59E0B' : '#10B981';
  const pulseClass = prob >= 80 ? 'animate-pulse' : '';
  
  const html = `<div class="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950/80 ${pulseClass}" style="background: ${color}20; border-color: ${color};">
    <div class="w-3.5 h-3.5 rounded-full" style="background: ${color};"></div>
    ${prob >= 80 ? `<div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background: ${color};"></div>` : ''}
  </div>`;
  
  return new L.DivIcon({
    html,
    className: 'predictive-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function FailureMap() {
  // Ahmedabad Wards predictive failure nodes
  const failureNodes = [
    { name: 'Judges Bungalow Road (Ward 6)', lat: 23.0338, lng: 72.5123, prob: 87, category: 'Drainage network block', days: 15 },
    { name: 'Maninagar Crossing Bypass (Ward 3)', lat: 22.9983, lng: 72.6025, prob: 74, category: 'Road surface collapse', days: 20 },
    { name: 'Naroda Industrial Main Pipe (Ward 4)', lat: 23.0805, lng: 72.6482, prob: 61, category: 'Water pipeline burst', days: 25 },
    { name: 'SG Highway Feeder Node 4 (Ward 2)', lat: 23.0189, lng: 72.5034, prob: 52, category: 'Streetlight feeder outage', days: 30 },
    { name: 'Vejalpur Community Depot (Ward 5)', lat: 22.9928, lng: 72.5284, prob: 31, category: 'Waste accumulation pileup', days: 40 }
  ];

  return (
    <div className="w-full h-[400px] rounded-[2rem] border border-slate-800 overflow-hidden relative shadow-2xl">
      <MapContainer 
        center={[23.03, 72.56]} 
        zoom={11.5} 
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {failureNodes.map((node, i) => (
          <Marker 
            key={i} 
            position={[node.lat, node.lng]}
            icon={createPredictivePin(node.prob)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5 min-w-[200px]">
                <h4 className="font-extrabold text-xs text-white leading-tight">{node.name}</h4>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Category:</span>
                  <span className="font-bold text-slate-300">{node.category}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Failure Probability:</span>
                  <span className={`font-black ${node.prob >= 80 ? 'text-rose-400' : node.prob >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{node.prob}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Estd Timeline:</span>
                  <span className="font-bold text-slate-300">{node.days} Days</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legends Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1.5 shadow-xl backdrop-blur-md">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Failure Risk Legends</span>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>High Failure Prob (80%+)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Medium Prob (50% - 79%)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Low Prob (0% - 49%)</span>
        </div>
      </div>
    </div>
  );
}
