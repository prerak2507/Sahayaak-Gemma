'use client';
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Layers, Navigation, Info, AlertTriangle, 
  Map as MapIcon, Activity, ArrowRight, Zap, Users, ShieldAlert,
  Sparkles, Sliders, Droplets, Filter, Flame, RefreshCw, Send, Check, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, addDoc, doc, updateDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useGovtStore } from '@/stores/govtStore';
import { CITY_COORDINATES, ALL_DEPARTMENTS, ALL_DEPARTMENT_EMPLOYEES } from '@/lib/data/govt-data';
import dynamic from 'next/dynamic';
import { scopeToCity } from '@/lib/data/needs';
import { useNeeds } from '@/lib/data/use-needs';

const GovtInteractiveMap = dynamic(
  () => import('@/components/map/GovtInteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center border border-slate-850 rounded-2xl">
        <Activity size={24} className="text-blue-500 animate-pulse mb-2" />
        <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
          Initializing Real-time GIS Engine...
        </span>
      </div>
    )
  }
);


const ALL_DEPARTMENTS_UI: Record<string, any[]> = {
  delhi: [
    { id: 'pwd', name: 'PWD Roads', icon: '🛣️', color: 'text-blue-400 border-blue-900/30 bg-blue-950/20' },
    { id: 'health_sanitation', name: 'Sanitation', icon: '🗑️', color: 'text-teal-400 border-teal-900/30 bg-teal-950/20' },
    { id: 'water_works', name: 'Water Works', icon: '🚰', color: 'text-sky-400 border-sky-900/30 bg-sky-950/20' },
    { id: 'drainage', name: 'Sewerage & Drainage', icon: '🌊', color: 'text-amber-400 border-amber-900/30 bg-amber-950/20' },
    { id: 'electricity', name: 'Power & Grid', icon: '⚡', color: 'text-yellow-400 border-yellow-900/30 bg-yellow-950/20' },
    { id: 'encroachment', name: 'Encroachment', icon: '🚧', color: 'text-rose-455 border-rose-900/30 bg-rose-950/20' },
    { id: 'fire_safety', name: 'Fire Safety', icon: '🔥', color: 'text-red-500 border-red-900/30 bg-red-950/20' }
  ],
  rajkot: [
    { id: 'rmc_roads', name: 'RMC Roads', icon: '🛣️', color: 'text-blue-400 border-blue-900/30 bg-blue-950/20' },
    { id: 'rmc_solid_waste', name: 'Solid Waste', icon: '🗑️', color: 'text-teal-400 border-teal-900/30 bg-teal-950/20' },
    { id: 'rmc_water', name: 'Water Distribution', icon: '🚰', color: 'text-sky-400 border-sky-900/30 bg-sky-950/20' },
    { id: 'rmc_drainage', name: 'Drainage', icon: '🌊', color: 'text-amber-400 border-amber-900/30 bg-amber-950/20' },
    { id: 'pgvcl', name: 'PGVCL Power', icon: '⚡', color: 'text-yellow-400 border-yellow-900/30 bg-yellow-950/20' }
  ]
};

// Coordinates mapping and municipal GIS datasets are encapsulated inside GovtInteractiveMap.tsx


export default function Page() {
  const { user } = useAuthStore();
  const [needs, setNeeds] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // We are removing single-dept scoped locks to allow viewing the massive city-wide telemetry
  const activeFilterDept = filterDept;

  // Dynamic employee simulated live locations from global store
  const { activeCity, employeePositions, setActiveCity } = useGovtStore();

  // 🌍 Sync with Jury Panel Geofence Sector
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'geofence_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.active_city && ['delhi', 'rajkot', 'surat', 'ahmedabad', 'pune'].includes(data.active_city)) {
          setActiveCity(data.active_city);
          // Optional: clear previous simulation when jury changes city to keep the map clean
          setSelectedIncident(null);
        }
      }
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    return () => unsub();
  }, [setActiveCity]);

  const DEPARTMENTS_UI_ICONS = ALL_DEPARTMENTS_UI[activeCity] || ALL_DEPARTMENTS_UI['rajkot'];
  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];
  const DEPARTMENT_EMPLOYEES = ALL_DEPARTMENT_EMPLOYEES[activeCity] || ALL_DEPARTMENT_EMPLOYEES['rajkot'];

  // Real-time server sync
  const { needs: boardNeeds } = useNeeds({ assignment: 'all' });

  useEffect(() => {
    // Read through the server. Firestore rules deny client reads, so the
    // browser subscription this replaces returned nothing on every load.
    setNeeds(boardNeeds);
  }, [boardNeeds]);

  const filteredNeeds = needs.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.description?.toLowerCase().includes(searchQuery.toLowerCase());
    // Supports 2 field / dual-department synchronization (Primary or Secondary matches filtered scope)
    const matchesDept = activeFilterDept 
      ? (n.assigned_department === activeFilterDept || n.secondary_department === activeFilterDept) 
      : true;
    return matchesSearch && matchesDept;
  });

  // Dynamic seeding with strictly 19 tasks mapping 1:1 to 19 unique volunteers
  const handleSeedSimulation = async () => {
    setIsSeeding(true);
    const toastId = toast.loading("Connecting to AI Command Engine to generate 19 autonomous tasks...");
    try {
      // First clear any existing simulation nodes to prevent duplicates
      const q = query(collection(db, 'needs'), where('is_simulated', '==', true));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'needs', docSnap.id));
      }

      // Format city for coordinate lookup (e.g., 'rajkot' -> 'Rajkot')
      const formattedCity = activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase();

      // Base coordinates based on currently active city
      const center = CITY_COORDINATES[formattedCity] || CITY_COORDINATES['Delhi'];
      const latC = center[0];
      const lngC = center[1];

      // Define exactly 19 tasks (3 PWD, 3 San, 3 Wat, 3 Dra, 3 Ele, 2 Enc, 2 Fir)
      const taskDefs = [
        { dept: 'pwd', title: "Massive Pothole Cluster", desc: "Multiple deep potholes reported on arterial road." },
        { dept: 'pwd', title: "Road Surface Cave-in", desc: "Asphalt collapsed forming a large hazardous sinkhole." },
        { dept: 'pwd', title: "Damaged Divider/Signage", desc: "Concrete divider broken and blocking the fast lane." },
        
        { dept: 'health_sanitation', title: "Illegal Garbage Dump", desc: "Large unauthorized solid waste pile causing severe odor." },
        { dept: 'health_sanitation', title: "Bio-Hazard Spill", desc: "Medical waste dumped openly near residential complex." },
        { dept: 'health_sanitation', title: "Blocked Public Toilet", desc: "Public sanitation block completely clogged and overflowing." },
        
        { dept: 'water_works', title: "Main Supply Pipe Burst", desc: "High pressure drinking water leaking onto the street." },
        { dept: 'water_works', title: "Valve Station Malfunction", desc: "Pumping station failing to maintain water pressure." },
        { dept: 'water_works', title: "Contaminated Supply", desc: "Brown water reported from municipal connection." },
        
        { dept: 'drainage', title: "Sewer Line Blockage", desc: "Main underground sewer choked, water flowing backwards." },
        { dept: 'drainage', title: "Open Manhole Danger", desc: "Manhole cover missing on a busy intersection." },
        { dept: 'drainage', title: "Storm Water Drain Clog", desc: "Heavy plastic debris blocking the storm drainage network." },
        
        { dept: 'electricity', title: "Live Wire Snapped", desc: "High tension wire snapped and lying on the footpath." },
        { dept: 'electricity', title: "Transformer Blowout", desc: "Local substation transformer caught fire and blew out." },
        { dept: 'electricity', title: "Streetlight Grid Failure", desc: "Entire sector plunged into darkness due to grid short." },
        
        { dept: 'encroachment', title: "Illegal Slum Extension", desc: "Unauthorized structures built encroaching the main footpath." },
        { dept: 'encroachment', title: "Commercial Setup on Road", desc: "Vendors completely blocking the thoroughfare." },
        
        { dept: 'fire_safety', title: "Commercial Building Smoke", desc: "Thick black smoke detected from a factory vent." },
        { dept: 'fire_safety', title: "Chemical Spill Hazard", desc: "Unidentified chemical barrels leaking in industrial zone." }
      ];

      for (let i = 0; i < taskDefs.length; i++) {
        const tDef = taskDefs[i];
        
        // Find the exact field engineer (0th, 1st, or 2nd) for this specific department
        const employeesForDept = DEPARTMENT_EMPLOYEES[tDef.dept] || [];
        // Map 0,1,2 of the tasks of this dept to the 0,1,2 index of the employees
        const tasksOfThisDeptSoFar = taskDefs.slice(0, i).filter(t => t.dept === tDef.dept).length;
        const matchedEmp = employeesForDept[tasksOfThisDeptSoFar] || { name: 'AI Auto-Engineer', title: 'Task Force Engineer', avatar: `https://i.pravatar.cc/150?u=rand-${Math.random()}` };
        
        // Wide random scatter coordinates spanning across the metropolitan region
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.02 + (Math.random() * 0.15); // Large radius spanning up to ~16km from center
        const lat = latC + (Math.cos(angle) * radius);
        const lng = lngC + (Math.sin(angle) * radius);

        const finalDoc = {
          title: tDef.title,
          description: tDef.desc,
          category: "government",
          assigned_department: tDef.dept,
          urgency_score: Math.floor(Math.random() * 5) + 5,
          status: "in_progress",
          latitude: lat,
          longitude: lng,
          location_lat: lat,
          location_lng: lng,
          landmark: `${activeCity} Zone ${i+1}`,
          created_at: new Date().toISOString(),
          assigned_worker_name: matchedEmp.name,
          assigned_worker_title: matchedEmp.title,
          assigned_worker_avatar: matchedEmp.avatar,
          routing_reason: `Strictly assigned by Command AI to ${matchedEmp.name} to enforce a 1:1 field engineer-to-task load distribution.`,
          is_simulated: true
        };
        
        await addDoc(collection(db, 'needs'), finalDoc);
      }
      toast.success("Successfully seeded 19 tasks matching 19 distinct field engineers!", { id: toastId, icon: '📡' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed real-time incidents.", { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };

  // Clear simulated nodes
  const handleClearSimulation = async () => {
    const toastId = toast.loading("Clearing simulation stream...");
    try {
      const q = query(collection(db, 'needs'), where('is_simulated', '==', true));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'needs', docSnap.id));
      }
      setSelectedIncident(null);
      toast.success("Simulation stream successfully cleared!", { id: toastId, icon: '🗑️' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear simulation stream.", { id: toastId });
    }
  };

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

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-950 overflow-hidden text-slate-100">
      
      {/* LEFT PANEL: NODE ROSTER SIDEBAR */}
      <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col relative z-25">
        
        {/* Roster Header */}
        <div className="p-5 border-b border-slate-800">
          <span className="text-[8px] font-mono text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-1">
            <Activity size={10} className="text-blue-500 animate-pulse" /> TELEMETRY ACTIVE
          </span>
          <h2 className="text-xl font-extrabold font-mukta text-white tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-blue-500" /> GIS Surveillance
          </h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time telemetric grid scanner</p>
          
          <div className="relative mt-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search active incident..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-900 outline-none transition-all" 
            />
          </div>
        </div>

        {/* Filter deck - We default to showing ALL 19 volunteers and tasks simultaneously */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-2">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Filter by Channel (Default: ALL):</p>
            <div className="flex flex-wrap gap-1">
              <button 
                onClick={() => setFilterDept(null)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                  filterDept === null ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                All 19
              </button>
              {DEPARTMENTS.map(d => (
                <button 
                  key={d.id}
                  onClick={() => setFilterDept(d.id)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
                    filterDept === d.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
        </div>

        {/* Roster Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Incident Nodes ({filteredNeeds.length})</p>
          
          {filteredNeeds.map((incident) => {
            const isHighUrgency = incident.urgency_score >= 8;
            const isSelected = selectedIncident?.id === incident.id;
            const hasSecondary = !!incident.secondary_department;
            
            return (
              <div 
                key={incident.id} 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 group relative overflow-hidden ${
                  isSelected 
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/5' 
                    : 'bg-slate-950/60 border-slate-850 hover:bg-slate-950 hover:border-slate-700'
                }`}
                onClick={() => {
                  setSelectedIncident(incident);
                  toast.success(`Locking telemetry on: ${incident.title}`, { icon: '📡' });
                }}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${isHighUrgency ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                
                <div className="flex justify-between items-start gap-1">
                  <p className={`font-extrabold text-xs leading-tight transition-colors ${isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'}`}>
                    {incident.title}
                  </p>
                  <span className={`text-[7px] font-mono font-black uppercase px-2 py-0.5 rounded border flex-shrink-0 ${
                    isHighUrgency ? 'text-red-400 bg-red-950/30 border-red-900/50' : 'text-blue-400 bg-blue-950/30 border-blue-900/50'
                  }`}>
                    {isHighUrgency ? '🚨 CRITICAL' : '🟢 STABLE'}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{incident.description}</p>
                
                <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-500 border-t border-slate-900 pt-1.5 mt-1">
                  <span className="flex items-center gap-1">📍 {incident.landmark || 'Rajkot'}</span>
                  {hasSecondary && (
                    <span className="text-[6.5px] font-black text-amber-450 bg-amber-950/40 px-1 py-0.2 rounded border border-amber-900/30">
                      ⚠️ DUAL FIELD
                    </span>
                  )}
                  <span>{incident.latitude ? `${incident.latitude.toFixed(3)}° N` : '28.61° N'}</span>
                </div>
              </div>
            );
          })}
          
          {filteredNeeds.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/40">
              <AlertTriangle className="text-slate-700 mx-auto mb-2" size={24} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No matching incident nodes</p>
              <p className="text-[8px] text-slate-600 mt-1">Click "Spawn AI Incidents" to seed data.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: SVG REGIONAL GEOGRAPHICAL TELEMETRY MAP */}
      <div className="flex-1 relative bg-slate-950 flex flex-col justify-between p-6">
        
        {/* Topology Header Console */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur relative z-20 shadow-md">
          <div>
            <h3 className="font-extrabold font-mukta text-lg uppercase tracking-wider text-white flex items-center gap-2">
              <MapIcon size={18} className="text-blue-400 animate-spin animate-duration-3000" /> REGIONAL TELEMETRY GEOGRAPHY
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">District Resource Topology Map & Live Scanning Grid</p>
          </div>
          
          <div className="flex items-center gap-2.5">
             <button
               onClick={handleSeedSimulation}
               disabled={isSeeding}
               className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
             >
               <Sparkles size={11} className="animate-pulse" /> Spawn AI Incidents
             </button>
             
             {filteredNeeds.length > 0 && (
                <button
                  onClick={handleClearSimulation}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-350 hover:text-white rounded-xl transition-all active:scale-95"
                  title="Clear Sim Stream"
                >
                  <RefreshCw size={12} />
                </button>
             )}
             
             <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM ACTIVE
             </span>
          </div>
        </div>

        {/* Dynamic Vector GIS Viewport */}
        <div className="flex-1 relative overflow-hidden min-h-[400px]">
          
          {/* Real-time Interactive Leaflet GIS Map */}
          <div className="absolute inset-0 z-0">
            <GovtInteractiveMap
              filteredNeeds={filteredNeeds}
              selectedIncident={selectedIncident}
              setSelectedIncident={setSelectedIncident}
              employeePositions={employeePositions}
              activeFilterDept={activeFilterDept}
              departments={DEPARTMENTS}
              departmentEmployees={DEPARTMENT_EMPLOYEES}
              activeCity={activeCity}
            />
          </div>

          {/* Radial HUD concentric circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-500/[0.01] rounded-full pointer-events-none z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/[0.015] rounded-full pointer-events-none z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/[0.02] rounded-full pointer-events-none z-10" />
          
          {/* Neon Scanner Sweep Line */}
          <div className="absolute top-1/2 left-1/2 w-[45%] h-0.5 bg-gradient-to-r from-blue-500/10 to-transparent origin-left rotate-45 animate-spin animate-duration-10000 pointer-events-none z-10" />

          {/* Grid telemetry matrix */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-10" 
               style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-40 pointer-events-none z-10" />

          {/* 📡 5. sleek Outlined INDIA GEOGRAPHIC INSET CARD (Top-Right corners) */}
          <div className="absolute top-4 right-4 w-32 h-36 bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-md z-20 shadow-2xl flex flex-col justify-between">
            <span className="text-[7px] font-black font-mono text-slate-500 uppercase tracking-widest block mb-1 text-center">
              📡 India Inset (Delhi Command)
            </span>
            <div className="relative flex-1 flex items-center justify-center">
              <svg className="w-full h-full opacity-60 text-slate-700" viewBox="0 0 100 100" fill="currentColor">
                 {/* High-fidelity vector outlined outline shape of Indian borders */}
                 <path d="M45,10 C50,12 52,18 55,20 C58,22 62,25 65,28 C68,30 72,32 75,35 C78,38 80,45 78,50 C76,55 72,58 70,62 C68,66 65,72 60,75 C55,78 50,82 48,88 C46,92 45,95 44,98 C42,95 40,90 38,85 C36,80 34,75 32,70 C30,65 28,62 26,58 C24,54 20,50 18,48 C16,46 12,45 10,43 L12,40 C15,38 20,38 24,35 C28,32 30,28 32,25 C34,22 38,18 40,15 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                 {/* Pulsing red beacon over the Rajkot city centre */}
                 <circle cx="46" cy="25" r="4.5" className="fill-emerald-400 animate-ping" />
                 <circle cx="46" cy="25" r="1.5" className="fill-emerald-500" />
              </svg>
              <span className="absolute bottom-4 left-6 text-[5px] font-mono text-emerald-400 bg-slate-950 px-1 py-0.2 rounded font-black border border-emerald-900/50">
                DELHI ACTIVE
              </span>
            </div>
            <p className="text-[6px] font-mono text-slate-500 text-center uppercase tracking-tighter leading-none mt-1">
              LAT: 28.61° N | LNG: 77.21° E
            </p>
          </div>

          {/* 🛸 LIVE NODE DETAIL OVERLAY CARD (Bottom-Left overlay panel) */}
          {selectedIncident ? (
            <div className="absolute bottom-6 left-6 max-w-sm bg-slate-900/90 border border-slate-800 shadow-2xl p-5 rounded-[2rem] backdrop-blur-md z-30 space-y-4 animate-in slide-in-from-bottom duration-300 relative border-l-4 border-l-blue-500 w-[90%] sm:w-80">
              
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[8px] font-mono text-blue-400 font-extrabold uppercase tracking-widest">
                    Telemetry Node Locked
                  </span>
                  <h4 className="font-extrabold text-white text-sm leading-tight mt-0.5">
                    {selectedIncident.title}
                  </h4>
                </div>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <p className="text-[10px] text-slate-350 leading-relaxed">
                {selectedIncident.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-[8px] font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 uppercase block">Landmark</span>
                  <span className="text-white font-extrabold">{selectedIncident.landmark || 'Delhi'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Primary Dept</span>
                  <span className="text-blue-400 font-extrabold uppercase">{selectedIncident.assigned_department}</span>
                </div>
                {selectedIncident.secondary_department && (
                  <div className="col-span-2 border-t border-slate-900 pt-1.5">
                    <span className="text-amber-450 font-black uppercase">⚠️ Dual Field Collaboration: {selectedIncident.secondary_department.toUpperCase()}</span>
                  </div>
                )}
                <div className="col-span-2 border-t border-slate-900 pt-1.5 mt-1 flex justify-between">
                  <span>LAT: {selectedIncident.latitude ? selectedIncident.latitude.toFixed(4) : '28.6139'}° N</span>
                  <span>LNG: {selectedIncident.longitude ? selectedIncident.longitude.toFixed(4) : '77.2090'}° E</span>
                </div>
              </div>

              {/* 🤝 Dual Assigned Technicians Profile Details */}
              {(selectedIncident.assigned_worker_name || selectedIncident.secondary_worker_name) && (
                <div className="space-y-2">
                  <span className="text-[7.5px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block leading-none">
                    🟢 Dispatched Collaborators
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2 border border-slate-850 rounded-xl">
                    {selectedIncident.assigned_worker_name && (
                      <div className="flex items-center gap-1.5">
                        <img 
                          src={selectedIncident.assigned_worker_avatar || "https://i.pravatar.cc/150?u=crew1"} 
                          alt={selectedIncident.assigned_worker_name}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-white truncate leading-none">{selectedIncident.assigned_worker_name}</p>
                          <p className="text-[6.5px] text-slate-400 truncate mt-0.5">{selectedIncident.assigned_worker_title}</p>
                        </div>
                      </div>
                    )}
                    {selectedIncident.secondary_worker_name && (
                      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                        <img 
                          src={selectedIncident.secondary_worker_avatar || "https://i.pravatar.cc/150?u=crew2"} 
                          alt={selectedIncident.secondary_worker_name}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-amber-400 truncate leading-none">{selectedIncident.secondary_worker_name}</p>
                          <p className="text-[6.5px] text-slate-400 truncate mt-0.5">{selectedIncident.secondary_worker_title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedIncident.routing_reason && (
                <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[7.5px] font-mono text-slate-500 uppercase block mb-0.5">⚙️ Autonomous Routing Rationale</span>
                  <p className="text-[8.5px] text-slate-400 italic leading-relaxed">{selectedIncident.routing_reason}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    toast.success("Rerouting direct alerts to dispatch center...", { icon: '📡' });
                    window.location.href = `/govt/cockpit`;
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <UserCheck size={11} /> Open Crew Switchboard
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-6 left-6 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-sm z-30 pointer-events-none">
              <p className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                <Info size={11} className="text-blue-400 animate-pulse" /> Select active node pin or card to lock telemetry tracking
              </p>
            </div>
          )}

          {/* Coordinates HUD Display */}
          <div className="absolute top-4 left-4 font-mono text-[8px] text-slate-500 space-y-1 z-10 pointer-events-none">
             <p>RAJKOT MUNICIPAL BOUNDS: ACTIVE</p>
             <p>GRID: DELHI_CITY_VECTOR_OK</p>
          </div>
          <div className="absolute bottom-4 right-4 font-mono text-[8px] text-slate-500 z-10 pointer-events-none">
             <p>R-NODE_TELEMETRY_SECURE_V2</p>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-slate-850 pt-4 bg-slate-900/20 px-4 py-3 rounded-2xl gap-2 relative z-20">
          <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2">
               <span className="w-3.5 h-3.5 bg-red-600 rounded-full border border-white/20 animate-pulse" /> 
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Urgent Incident Node</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3.5 h-3.5 bg-blue-500 rounded-full border border-white/20" /> 
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stable Incident Node</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3.5 h-3.5 bg-amber-500 rounded-full border border-white/20" /> 
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dual Field Cooperation</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3.5 h-3.5 bg-emerald-400 flex items-center justify-center rounded-full border border-emerald-400 text-[8px]">👷</span> 
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulated Active Dispatcher</span>
             </div>
          </div>
          <span className="text-[8px] font-mono text-slate-500">City SECURED TELEMETRY LOCKS</span>
        </div>
      </div>
    </div>
  );
}
