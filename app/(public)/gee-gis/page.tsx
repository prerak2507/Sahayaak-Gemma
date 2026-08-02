'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Map, RefreshCw, Layers, ShieldCheck, Activity, Zap, Cpu, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Helper to pan map
const MapPanTo = dynamic(() => import('@/components/map/MapPanTo'), { ssr: false });

export default function GeeGisPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number]>([28.6139, 77.2090]); // Default Delhi
  const [anomalies, setAnomalies] = useState<Array<{id: number, lat: number, lng: number, type: string}>>([]);
  const [stats, setStats] = useState({
    greenCover: '42.8%', trendGreen: '+1.2%',
    floodZones: '14 Clusters', trendFlood: '-2',
    anomalies: '8 Nodes', trendAnomalies: 'Stable'
  });

  const handleSync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          generateMockAnomalies(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
          generateMockAnomalies(userLocation[0], userLocation[1]);
        }
      );
    } else {
      generateMockAnomalies(userLocation[0], userLocation[1]);
    }

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const generateMockAnomalies = (lat: number, lng: number) => {
    // Generate 3-7 random anomalies around the user's location
    const count = Math.floor(Math.random() * 5) + 3;
    const newAnomalies = [];
    for (let i = 0; i < count; i++) {
      // offset by roughly +/- 2km
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;
      const types = ['Infrastructure Defect', 'Water Logging', 'Vegetation Loss', 'Pothole Cluster'];
      newAnomalies.push({
        id: i,
        lat: lat + latOffset,
        lng: lng + lngOffset,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    setAnomalies(newAnomalies);
    setStats({
      greenCover: (Math.random() * 20 + 20).toFixed(1) + '%',
      trendGreen: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 2).toFixed(1) + '%',
      floodZones: Math.floor(Math.random() * 10) + ' Clusters',
      trendFlood: 'Stable',
      anomalies: newAnomalies.length + ' Nodes',
      trendAnomalies: '+' + Math.floor(Math.random() * 5)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Satellite Link Active
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mukta mb-2">
                GEE GIS Satellite Sync
              </h1>
              <p className="text-slate-300 max-w-2xl text-sm md:text-base">
                Real-time Google Earth Engine spatial data synchronization. Monitor infrastructure changes, identify high-risk zones, and optimize resource deployment across the municipal grid.
              </p>
            </div>
            
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg text-sm ${
                isSyncing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/25'
              }`}
            >
              <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={20} />
              {isSyncing ? `Syncing... ${syncProgress}%` : 'Initiate Spatial Sync'}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Map Area (Placeholder) */}
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] relative">
            {isSyncing || syncProgress > 0 ? (
              <div className="absolute inset-0 z-0">
                  <MapContainer 
                  center={userLocation} 
                  zoom={14} 
                  zoomControl={true}
                  scrollWheelZoom={true}
                  className="w-full h-full"
                >
                  <MapPanTo lat={userLocation[0]} lng={userLocation[1]} zoom={14} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EAW, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  {syncProgress === 100 && (
                    <Circle 
                      center={userLocation} 
                      radius={3000} 
                      pathOptions={{ 
                        color: '#ef4444', 
                        fillColor: '#ef4444', 
                        fillOpacity: 0.15 
                      }} 
                    />
                  )}
                  {syncProgress === 100 && anomalies.map((anomaly) => (
                    <Marker key={anomaly.id} position={[anomaly.lat, anomaly.lng]}>
                      <Popup>
                        <div className="text-xs font-bold text-slate-800">
                          🔴 {anomaly.type}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Detected via Satellite Feed
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
                {syncProgress < 100 && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${syncProgress}%` }} />
                    </div>
                    <span className="block mt-4 text-emerald-400 font-mono text-xs font-bold drop-shadow-md">
                      [ Fetching spatial tiles: {syncProgress}% ]
                    </span>
                  </div>
                )}
                {syncProgress === 100 && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <div className="relative w-40 h-40 border border-red-500/30 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-32 h-32 border-2 border-dashed border-red-400/40 rounded-full animate-spin [animation-duration:10s]"></div>
                      <div className="absolute w-3 h-3 bg-red-400 rounded-full shadow-[0_0_12px_#ef4444]"></div>
                      <div className="absolute w-12 h-[1.5px] bg-red-400/60"></div>
                      <div className="absolute h-12 w-[1.5px] bg-red-400/60"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-6 text-center z-0">
                <Map size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Spatial Map Feed Pending</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2">
                  Connect your Google Earth Engine API keys or initiate Spatial Sync to pull live telemetry.
                </p>
              </div>
            )}
            
            {/* Overlay Status Bar */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-lg flex justify-between items-center z-20">
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-slate-500">Lat: <span className="font-bold text-slate-800">{userLocation[0].toFixed(4)}° N</span></span>
                <span className="text-slate-500">Lng: <span className="font-bold text-slate-800">{userLocation[1].toFixed(4)}° E</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <ShieldCheck size={16} /> Data Secured
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-4">
                <Activity size={20} className="text-blue-500" />
                Telemetry Stats
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Green Cover Detected', value: stats.greenCover, trend: stats.trendGreen },
                  { label: 'High Risk Flood Zones', value: stats.floodZones, trend: stats.trendFlood },
                  { label: 'Infrastructure Anomalies', value: stats.anomalies, trend: stats.trendAnomalies }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-end p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-lg font-black text-slate-800">{stat.value}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {stat.trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2rem] p-6 text-white shadow-lg">
              <h3 className="text-lg font-extrabold flex items-center gap-2 mb-2">
                <Cpu size={20} className="text-indigo-300" />
                AI Analysis Node
              </h3>
              <p className="text-indigo-200 text-sm leading-relaxed mb-4">
                Gemma analyses the incoming GEE feed for automated anomaly detection. 
              </p>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold text-sm text-white flex justify-center items-center gap-2 border border-white/10">
                <Zap size={16} className="text-yellow-400" />
                Run Deep Scan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
