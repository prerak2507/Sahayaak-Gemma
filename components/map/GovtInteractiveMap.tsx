'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// 🗺️ Geographical Path Vectors for Delhi
const rmcBoundaryPoints: [number, number][] = [
  [22.3500, 70.7850],
  [22.3300, 70.8300],
  [22.2800, 70.8250],
  [22.2500, 70.8000],
  [22.2550, 70.7500],
  [22.2900, 70.7400],
  [22.3300, 70.7550]
];

const ajiRiverPoints: [number, number][] = [
  [22.2500, 70.8250],
  [22.2680, 70.8210],
  [22.2850, 70.8140],
  [22.2990, 70.8110],
  [22.3150, 70.8130],
  [22.3350, 70.8210],
  [22.3500, 70.8280]
];

const kalavadRoadPoints: [number, number][] = [
  [22.2850, 70.7400],
  [22.2890, 70.7600],
  [22.2904, 70.7749],
  [22.2930, 70.7900],
  [22.3000, 70.8100]
];

const universityRoadPoints: [number, number][] = [
  [22.2550, 70.7620],
  [22.2750, 70.7650],
  [22.2929, 70.7687],
  [22.3200, 70.7710]
];

const gondalRoadPoints: [number, number][] = [
  [22.2500, 70.8038],
  [22.2848, 70.8038],
  [22.3150, 70.8038]
];

const yagnikRoadPoints: [number, number][] = [
  [22.2996, 70.7974],
  [22.3180, 70.7920]
];

interface GovtInteractiveMapProps {
  filteredNeeds: any[];
  selectedIncident: any | null;
  setSelectedIncident: (incident: any) => void;
  employeePositions: Record<string, { lat: number; lng: number; landmark: string; status: string }>;
  activeFilterDept: string | null;
  departments: Array<{ id: string; name: string; icon: string; color: string }>;
  departmentEmployees: Record<string, Array<{ id: string; name: string; title: string; defaultStatus: string; avatar: string }>>;
  activeCity?: string;
}

// Helper component to center and zoom on a selected incident
function FlyToPoint({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function GovtInteractiveMap({
  filteredNeeds,
  selectedIncident,
  setSelectedIncident,
  employeePositions,
  activeFilterDept,
  departments,
  departmentEmployees,
  activeCity = 'Delhi'
}: GovtInteractiveMapProps) {

  const getDeptIcon = (deptId: string) => {
    switch (deptId) {
      case 'pwd': return '🛣️';
      case 'health_sanitation': return '🗑️';
      case 'water_works': return '🚰';
      case 'drainage': return '🌊';
      case 'electricity': return '⚡';
      case 'encroachment': return '🚧';
      case 'fire_safety': return '🔥';
      default: return '📍';
    }
  };

  // Custom icon creator for Incidents
  const createIncidentIcon = (incident: any, isSelected: boolean) => {
    const isHighUrgency = incident.urgency_score >= 8;
    const hasSecondary = !!incident.secondary_department;
    const deptIcon = getDeptIcon(incident.assigned_department);
    
    let bgClass = 'bg-blue-500';
    if (isSelected) {
      bgClass = 'bg-amber-400 ring-4 ring-amber-500/30 scale-110';
    } else if (isHighUrgency) {
      bgClass = 'bg-red-600';
    } else if (hasSecondary) {
      bgClass = 'bg-amber-500';
    }
    
    let pulseClass = '';
    if (isHighUrgency) {
      pulseClass = 'animate-ping border-red-500/40 bg-red-500/10 w-12 h-12';
    } else if (hasSecondary) {
      pulseClass = 'animate-pulse border-amber-500/40 bg-amber-500/10 w-10 h-10';
    } else {
      pulseClass = 'animate-pulse border-blue-500/40 bg-blue-500/10 w-8 h-8';
    }

    const html = `
      <div class="relative flex items-center justify-center w-full h-full">
        <!-- Sonar Ring -->
        <div class="absolute rounded-full border pointer-events-none ${pulseClass}" style="transform: translate(-50%, -50%); left: 50%; top: 50%;"></div>
        
        <!-- Pin dot -->
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-black select-none cursor-pointer transition-transform hover:scale-125 ${bgClass}" style="position: absolute; z-index: 20;">
          ${deptIcon}
        </div>
      </div>
    `;
    
    return L.divIcon({
      html,
      className: 'custom-incident-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // Custom icon creator for Workers
  const createWorkerIcon = (emp: any) => {
    const html = `
      <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -50%); left: 50%; top: 50%;">
        <!-- Sonar Ring -->
        <div class="absolute w-10 h-10 rounded-full bg-emerald-400/20 border border-emerald-400/40 animate-ping pointer-events-none" style="top: 0; left: 0;"></div>
        
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full border-2 border-emerald-400 bg-slate-900 overflow-hidden shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-115" style="z-index: 10;">
          <img src="${emp.avatar}" alt="${emp.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        
        <!-- Nameplate -->
        <span class="mt-1 bg-slate-950/80 border border-slate-800 text-[8px] font-mono font-black text-emerald-450 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm whitespace-nowrap" style="z-index: 10;">
          ${emp.name.split(' ')[0]}
        </span>
      </div>
    `;
    
    return L.divIcon({
      html,
      className: 'custom-worker-marker',
      iconSize: [40, 50],
      iconAnchor: [20, 25],
      popupAnchor: [0, -25]
    });
  };

  // Get coordinates for active city
  // Requires importing CITY_COORDINATES
  // We'll just define the map here so we don't have to import if it causes cycle
  const mapCenterCoords: Record<string, [number, number]> = {
    Delhi: [28.6139, 77.2090],
    Rajkot: [22.3039, 70.8022],
    Surat: [21.1702, 72.8311],
    Ahmedabad: [23.0225, 72.5714],
    Pune: [18.5204, 73.8567]
  };
  
  const formattedCity = activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase();
  const centerCoord = mapCenterCoords[formattedCity] || mapCenterCoords['Delhi'];

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-850 shadow-2xl">
      <MapContainer
        center={centerCoord}
        zoom={12}
        zoomControl={true}
        className="w-full h-full z-0 bg-slate-950"
      >
        {/* Auto pan to city when changed (if no incident is selected) */}
        {!selectedIncident && <FlyToPoint lat={centerCoord[0]} lng={centerCoord[1]} zoom={12} />}
        {/* Esri World Imagery Satellite Base Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EAW, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          keepBuffer={10}
          updateWhenZooming={false}
          updateWhenIdle={true}
        />

        {/* Center the map if an incident is selected */}
        {selectedIncident && selectedIncident.latitude && selectedIncident.longitude && (
          <FlyToPoint lat={selectedIncident.latitude} lng={selectedIncident.longitude} zoom={15} />
        )}

        {/* Render Delhi Layers ONLY if default view or incident coordinates are in Delhi (latitude < 25) */}
        {(!selectedIncident || (selectedIncident.latitude && selectedIncident.latitude < 25)) && (
          <>
            {/* 1. Delhi Municipal City Limits Outline */}
            <Polygon
              positions={rmcBoundaryPoints}
              pathOptions={{
                fillColor: '#0f172a',
                fillOpacity: 0.25,
                color: '#1e3a8a',
                weight: 2,
                dashArray: '6, 6'
              }}
            />

            {/* 2. Lakes & Reservoirs */}
            {/* Nyari Dam Reservoir (West) */}
            <Circle
              center={[22.2600, 70.7450]}
              radius={1200}
              pathOptions={{
                fillColor: '#0369a1',
                fillOpacity: 0.2,
                color: '#0284c7',
                weight: 1.5
              }}
            >
              <Tooltip permanent direction="top" className="bg-transparent border-none shadow-none text-[8px] font-bold text-sky-400 font-mono tracking-wider opacity-60">
                NYARI DAM RESERVOIR
              </Tooltip>
            </Circle>

            {/* Lal Pari Lake (Northeast) */}
            <Circle
              center={[22.3300, 70.8250]}
              radius={1000}
              pathOptions={{
                fillColor: '#0369a1',
                fillOpacity: 0.2,
                color: '#0284c7',
                weight: 1.5
              }}
            >
              <Tooltip permanent direction="top" className="bg-transparent border-none shadow-none text-[8px] font-bold text-sky-400 font-mono tracking-wider opacity-60">
                LAL PARI WATER RESERVE
              </Tooltip>
            </Circle>

            {/* Race Course Ring Road Park (Central) */}
            <Circle
              center={[22.3020, 70.7900]}
              radius={450}
              pathOptions={{
                fillColor: '#065f46',
                fillOpacity: 0.2,
                color: '#059669',
                weight: 1.5
              }}
            >
              <Tooltip permanent direction="top" className="bg-transparent border-none shadow-none text-[8px] font-bold text-emerald-400 font-mono tracking-wider opacity-60">
                City RACE COURSE GREEN
              </Tooltip>
            </Circle>

            {/* 3. Aji River Flow (Glowing Cyan Corridor) */}
            <Polyline
              positions={ajiRiverPoints}
              pathOptions={{
                color: '#0891b2',
                weight: 8,
                opacity: 0.2
              }}
            />
            <Polyline
              positions={ajiRiverPoints}
              pathOptions={{
                color: '#22d3ee',
                weight: 2.5,
                opacity: 0.5
              }}
            >
              <Tooltip sticky direction="right" className="bg-slate-900/90 border border-slate-800 text-[8px] text-cyan-400 font-mono font-bold px-2 py-0.5 rounded shadow-lg">
                AJI RIVER FLOW CORRIDOR
              </Tooltip>
            </Polyline>

            {/* 4. Municipal Road Networks */}
            {/* Kalavad Road */}
            <Polyline
              positions={kalavadRoadPoints}
              pathOptions={{
                color: '#3b82f6',
                weight: 1.5,
                opacity: 0.4
              }}
            >
              <Tooltip sticky direction="top" className="bg-slate-900/90 border border-slate-800 text-[8px] text-blue-400 font-mono px-2 py-0.5 rounded shadow-lg">
                KALAVAD RD VECTOR
              </Tooltip>
            </Polyline>

            {/* University Road */}
            <Polyline
              positions={universityRoadPoints}
              pathOptions={{
                color: '#14b8a6',
                weight: 1.5,
                opacity: 0.4
              }}
            >
              <Tooltip sticky direction="left" className="bg-slate-900/90 border border-slate-800 text-[8px] text-teal-400 font-mono px-2 py-0.5 rounded shadow-lg">
                UNIVERSITY ROAD
              </Tooltip>
            </Polyline>

            {/* Gondal Road */}
            <Polyline
              positions={gondalRoadPoints}
              pathOptions={{
                color: '#8b5cf6',
                weight: 1.5,
                opacity: 0.45
              }}
            >
              <Tooltip sticky direction="right" className="bg-slate-900/90 border border-slate-800 text-[8px] text-violet-400 font-mono px-2 py-0.5 rounded shadow-lg">
                GONDAL HIGHWAY
              </Tooltip>
            </Polyline>

            {/* Yagnik Road */}
            <Polyline
              positions={yagnikRoadPoints}
              pathOptions={{
                color: '#eab308',
                weight: 1.5,
                opacity: 0.4
              }}
            >
              <Tooltip sticky direction="top" className="bg-slate-900/90 border border-slate-800 text-[8px] text-yellow-400 font-mono px-2 py-0.5 rounded shadow-lg">
                YAGNIK RD AVE
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* Render New Delhi Layers dynamically when Delhi coordinates are active or selected */}
        {((selectedIncident && selectedIncident.latitude && selectedIncident.latitude > 25) || (!selectedIncident)) && (
          <>
            {/* 1. New Delhi Yamuna River flow vector (Glowing Cyan Corridor) */}
            <Polyline
              positions={[
                [28.7200, 77.2600],
                [28.6900, 77.2700],
                [28.6700, 77.2680],
                [28.6400, 77.2750],
                [28.6258, 77.2625], // ITO Barrage
                [28.5900, 77.2680],
                [28.5600, 77.2950],
                [28.5462, 77.3160], // Kalindi Kunj Barrage
                [28.5100, 77.3300]
              ]}
              pathOptions={{
                color: '#0891b2',
                weight: 10,
                opacity: 0.25
              }}
            />
            <Polyline
              positions={[
                [28.7200, 77.2600],
                [28.6900, 77.2700],
                [28.6700, 77.2680],
                [28.6400, 77.2750],
                [28.6258, 77.2625], // ITO Barrage
                [28.5900, 77.2680],
                [28.5600, 77.2950],
                [28.5462, 77.3160], // Kalindi Kunj Barrage
                [28.5100, 77.3300]
              ]}
              pathOptions={{
                color: '#22d3ee',
                weight: 3.5,
                opacity: 0.6
              }}
            >
              <Tooltip sticky direction="right" className="bg-slate-900/90 border border-slate-800 text-[8px] text-cyan-400 font-mono font-bold px-2 py-0.5 rounded shadow-lg">
                YAMUNA RIVER COGNITIVE FLOW
              </Tooltip>
            </Polyline>

            {/* 2. Key Delhi Geodetic Zones */}
            {/* Connaught Place Center Circle (HUD Marker) */}
            <Circle
              center={[28.6304, 77.2177]}
              radius={800}
              pathOptions={{
                fillColor: '#1e3a8a',
                fillOpacity: 0.1,
                color: '#3b82f6',
                weight: 1.5,
                dashArray: '4, 4'
              }}
            >
              <Tooltip permanent direction="top" className="bg-transparent border-none shadow-none text-[8px] font-bold text-blue-400 font-mono tracking-wider opacity-60">
                CENTRAL DELHI CORRIDOR (CP)
              </Tooltip>
            </Circle>

            {/* Okhla Bird Sanctuary / Environmental Zone */}
            <Circle
              center={[28.5282, 77.3235]}
              radius={1000}
              pathOptions={{
                fillColor: '#065f46',
                fillOpacity: 0.15,
                color: '#059669',
                weight: 1.5
              }}
            >
              <Tooltip permanent direction="bottom" className="bg-transparent border-none shadow-none text-[8px] font-bold text-emerald-400 font-mono tracking-wider opacity-60">
                OKHLA WETLAND RESERVE
              </Tooltip>
            </Circle>
          </>
        )}

        {/* 📍 Active Incident Pins */}
        {filteredNeeds.map((incident) => {
          const lat = incident.latitude || incident.location_lat || (28.60 + (incident.id.charCodeAt(0) % 5) * 0.01);
          const lng = incident.longitude || incident.location_lng || (77.20 + (incident.id.charCodeAt(1) % 5) * 0.01);
          const isSelected = selectedIncident?.id === incident.id;
          const isHighUrgency = incident.urgency_score >= 8;

          return (
            <Marker
              key={incident.id}
              position={[lat, lng]}
              icon={createIncidentIcon(incident, isSelected)}
              eventHandlers={{
                click: () => {
                  setSelectedIncident(incident);
                  toast.success(`Coordinates Locked: ${incident.title}`, { icon: '📡' });
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -16]} className="bg-slate-900/95 border border-slate-800 text-slate-100 text-[10px] font-sans font-bold rounded-xl px-2.5 py-1.5 shadow-2xl relative border-l-4 border-l-blue-500">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-blue-400 font-mono uppercase tracking-widest font-black">LOCK TELEMETRY</span>
                  <span>{incident.title}</span>
                  <span className="text-[7.5px] text-slate-400 font-mono mt-0.5">Urgency Level: {incident.urgency_score}/10 {isHighUrgency ? '🚨' : ''}</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 👷 Simulated Worker Telemetry Markers */}
        {(activeFilterDept ? [activeFilterDept] : departments.map(d => d.id)).map(deptId => {
          return departmentEmployees[deptId]?.map((emp, idx) => {
            let pos = employeePositions[emp.id];
            
            // Snap to task location if the volunteer is currently assigned to one
            const assignedTask = filteredNeeds.find(
              task => task.assigned_worker_name === emp.name || task.secondary_worker_name === emp.name
            );

            if (assignedTask && (assignedTask.latitude || assignedTask.location_lat) && (assignedTask.longitude || assignedTask.location_lng)) {
              pos = {
                lat: (assignedTask.latitude || assignedTask.location_lat) + 0.0005, // Micro-offset so they don't perfectly hide the task pin
                lng: (assignedTask.longitude || assignedTask.location_lng) + 0.0005,
                landmark: `Active: ${assignedTask.title}`,
                status: 'ON-SITE DEPLOYED'
              };
            }

            // Only render workers if they are actively assigned to an incident (hides randomly spawned unassigned workers)
            if (!assignedTask) return null;

            return (
              <Marker
                key={`leaflet-emp-${emp.id}`}
                position={[pos.lat, pos.lng]}
                icon={createWorkerIcon(emp)}
              >
                <Tooltip direction="bottom" className="bg-slate-900/95 border border-slate-800 text-slate-100 rounded-2xl p-3 text-[10px] font-sans shadow-2xl w-48 border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-850 mb-1.5">
                    <img src={emp.avatar} className="w-6 h-6 rounded-lg object-cover" />
                    <div>
                      <p className="font-extrabold text-emerald-450 leading-none">🟢 {emp.name}</p>
                      <p className="text-[7px] text-slate-400 mt-0.5 font-mono">{emp.title}</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-350">Position: <b className="text-white">{pos.landmark}</b></p>
                  <p className="text-[7.5px] text-blue-400 mt-1 border-t border-slate-850 pt-1 font-mono font-bold flex justify-between">
                    <span>GRID: GPS_LOCATED</span> 
                    <span>{pos.status}</span>
                  </p>
                </Tooltip>
              </Marker>
            );
          });
        })}
      </MapContainer>
    </div>
  );
}
