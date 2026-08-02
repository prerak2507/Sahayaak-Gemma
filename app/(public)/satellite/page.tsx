'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, Sparkles, Filter, Navigation, ArrowRight, CheckCircle2,
  AlertTriangle, Radio, RefreshCw, Layers, CheckCircle, Lock, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const SatelliteMap = dynamic(() => import('@/components/satellite/SatelliteMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-[2rem]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-sky-500 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Resolving High-Resolution Geodetic Tiles...</p>
      </div>
    </div>
  )
});

interface Anomaly {
  id: string;
  title: string;
  category: string;
  confidence: number;
  lat: number;
  lng: number;
  description: string;
}

// 🏢 AI Geospatial Autonomous Routing Profiles mapping category to departments & specialist database workers
const AI_ROUTING_PROFILES: Record<string, {
  deptId: string;
  deptName: string;
  workerName: string;
  workerTitle: string;
  workerAvatar: string;
  reason: string;
}> = {
  'Waste Management': {
    deptId: 'health_sanitation',
    deptName: 'Health & Sanitation (Garbage)',
    workerName: 'Ramesh Koli',
    workerTitle: 'Ward 7 Sanitation Inspector',
    workerAvatar: 'https://i.pravatar.cc/150?u=emp-san-1',
    reason: 'Autonomous Geospatial AI detected high density organic/inorganic waste pileup. Dispatched Sanitation Division anti-smog sweeper vehicles and waste collector truck.'
  },
  'Road Surface': {
    deptId: 'pwd',
    deptName: 'PWD Road Engineering (Potholes)',
    workerName: 'PWD Field Engineers',
    workerTitle: 'Asphalt Maintenance Lead',
    workerAvatar: 'https://i.pravatar.cc/150?u=emp-pwd-1',
    reason: 'Autonomous Geospatial AI identified road surface cracking. Dispatched PWD asphalt maintenance specialist to conduct underpass repairs and seal fissures.'
  },
  'Encroachment': {
    deptId: 'encroachment',
    deptName: 'Encroachment Eviction',
    workerName: 'Ketan Chawda',
    workerTitle: 'Field Demolition Officer',
    workerAvatar: 'https://i.pravatar.cc/150?u=emp-enc-1',
    reason: 'Autonomous Geospatial AI flagged temporary/commercial structures encroaching public sidewalk. Dispatched enforcement officer for boundary audit.'
  },
  'Waterlogging / Drainage': {
    deptId: 'drainage',
    deptName: 'Sanitation & Drainage',
    workerName: 'Sohan Prasad',
    workerTitle: 'Sewer Jetting Operator',
    workerAvatar: 'https://i.pravatar.cc/150?u=emp-drain-1',
    reason: 'Autonomous Geospatial AI mapped critical stormwater pooling. Dispatched drainage sewer jetting specialist to extract blockage and pump excess water.'
  }
};

export default function SatelliteIntelligence() {
  const { isAuthenticated } = useAuthStore();
  
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    { id: 'sat-1', title: 'Illegal Waste Dumping, Naroda', category: 'Waste Management', confidence: 94, lat: 23.0805, lng: 72.6482, description: 'Large volume of construction debris and raw plastic piling observed near the Naroda GIDC secondary boundary wall.' },
    { id: 'sat-2', title: 'Severe Road Breakdown, Prahladnagar', category: 'Road Surface', confidence: 89, lat: 23.0338, lng: 72.5123, description: 'Severe lateral cracking and asphalt crumbling detected on Judges Bungalow Road — suggests structural drainage backup.' },
    { id: 'sat-3', title: 'Footpath Encroachment, Maninagar', category: 'Encroachment', confidence: 82, lat: 22.9983, lng: 72.6025, description: 'Illegal construction of commercial stalls extending 1.5 meters into the public pedestrian lane near crossing.' },
    { id: 'sat-4', title: 'High-Density Waterlogging, Naroda', category: 'Waterlogging / Drainage', confidence: 91, lat: 23.0825, lng: 72.6412, description: 'Raw stormwater ponding detected at Naroda crossroads bypass node. System suggests drainage backup.' },
    { id: 'sat-5', title: 'Garbage Dump Pileup, Bodakdev', category: 'Waste Management', confidence: 78, lat: 23.0189, lng: 72.5034, description: 'Secondary landfill overflow detected. Organic matter observed outside the corporate bins.' }
  ]);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(anomalies[0]);
  const [ticketStatus, setTicketStatus] = useState<Record<string, boolean>>({});
  const [isDispatching, setIsDispatching] = useState(false);

  const handleConvertTicket = async () => {
    if (!selectedAnomaly) return;
    setIsDispatching(true);
    
    const profile = AI_ROUTING_PROFILES[selectedAnomaly.category] || AI_ROUTING_PROFILES['Waste Management'];
    const toastId = toast.loading("AI commencing geodetic dispatch sequence...", { icon: '🛰️' });
    
    try {
      // 1. Seed need document into Firestore
      const newIncident = {
        title: selectedAnomaly.title,
        description: selectedAnomaly.description,
        category: "government",
        assigned_department: profile.deptId,
        secondary_department: null,
        urgency_score: selectedAnomaly.confidence >= 90 ? 9 : 8,
        latitude: Number(selectedAnomaly.lat),
        longitude: Number(selectedAnomaly.lng),
        landmark: selectedAnomaly.title.split(', ')[1] || "Ahmedabad Zone",
        routing_reason: `Autonomous Satellite AI dispatch: ${profile.reason}`,
        status: "dispatched",
        created_at: new Date().toISOString(),
        
        // Assigned Specialist details
        assigned_worker_name: profile.workerName,
        assigned_worker_title: profile.workerTitle,
        assigned_worker_avatar: profile.workerAvatar
      };

      await addDoc(collection(db, 'needs'), newIncident);

      // 2. Seed notification targeting Commissioner Kavita Patel (demo-govt-001)
      const newNotification = {
        userId: "demo-govt-001",
        title: "📡 Proactive Satellite AI Dispatch Alert",
        message: `Geospatial AI auto-detected "${selectedAnomaly.title}" (Confidence: ${selectedAnomaly.confidence}%). Department "${profile.deptName}" has been autonomously mobilized with specialist ${profile.workerName}.`,
        type: "urgent",
        read: false,
        created_at: new Date().toISOString(),
        latitude: selectedAnomaly.lat,
        longitude: selectedAnomaly.lng
      };

      await addDoc(collection(db, 'notifications'), newNotification);

      setTicketStatus(prev => ({ ...prev, [selectedAnomaly.id]: true }));
      toast.success(`AI Dispatched: ${profile.workerName} deployed to ${newIncident.landmark}!`, { id: toastId, icon: '👷' });
    } catch (err: any) {
      console.error(err);
      toast.error(`Auto-dispatch failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDispatching(false);
    }
  };

  // 🔒 Render gorgeous glassmorphic lockout page for public / unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex items-center justify-center p-6 relative overflow-hidden pt-24">
        {/* Glowing Matrix Background Lines */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 max-w-lg text-center backdrop-blur-md shadow-2xl relative space-y-6">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-indigo-500" />
          
          <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner">
            <Lock className="text-sky-400" size={32} />
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.25em] bg-sky-950/80 px-3 py-1 rounded-full border border-sky-900/80">
              Restricted Enterprise GIS Node
            </span>
            <h1 className="text-xl md:text-2xl font-black font-mukta text-white mt-2">
              Security Access Authorization Required
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Proactive multi-spectral satellite remote sensing, AI anomaly intelligence sweeps, and autonomous crew routing registries are restricted to authenticated City municipal and NGO command personnel.
            </p>
          </div>

          <div className="border-t border-slate-850 pt-6 space-y-4">
            <p className="text-[10px] text-slate-500 font-mono">
              IP: SECURE-LOOPBACK // PORT: 443 // COMPLIANCE: City-GIS-2026
            </p>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/10 active:scale-95 flex items-center justify-center gap-2"
            >
              <UserCheck size={14} />
              Login to Authorize Telemetry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeProfile = selectedAnomaly 
    ? (AI_ROUTING_PROFILES[selectedAnomaly.category] || AI_ROUTING_PROFILES['Waste Management'])
    : null;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-24 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* HEADER BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 mb-8 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.25em] bg-sky-950/80 px-3 py-1 rounded-full border border-sky-900/80">
              AI Remote Sensing Node
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-mukta text-white mt-2 tracking-tight">
              Satellite Anomaly Intelligence — Ahmedabad Region
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous satellite remote sensing detecting illegal dumping, encroachments, and waterlogging
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 self-end">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Orbiting Live</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THREE COLUMN GRID COMMAND LAYOUT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
          
          {/* Column 1: Left Anomaly List */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 block">
              Orbital Anomaly Logs
            </span>
            
            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 flex-1">
              {anomalies.map((anom) => (
                <div 
                  key={anom.id}
                  onClick={() => setSelectedAnomaly(anom)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 space-y-2 text-left relative overflow-hidden ${
                    selectedAnomaly?.id === anom.id 
                      ? 'bg-slate-900 border-sky-500/40' 
                      : 'bg-slate-950/80 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{anom.category}</span>
                    <span className="text-[9px] font-black text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-900/80">{anom.confidence}% Confidence</span>
                  </div>
                  <h3 className="text-xs font-bold leading-relaxed text-slate-200 truncate">{anom.title}</h3>
                  
                  {ticketStatus[anom.id] && (
                    <span className="absolute bottom-2 right-2 text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900 flex items-center gap-0.5">
                      ✓ Sent
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => toast.success('Reloading satellite overlays...', { icon: '🔄' })}
              className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} /> Sync Orbit Telemetry
            </button>
          </div>

          {/* Column 2 & 3: Geospatial Canvas */}
          <div className="lg:col-span-2 h-[550px] lg:h-auto rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative">
            <SatelliteMap 
              anomalies={anomalies}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
            />
          </div>

          {/* Column 4: Right AI Inspection & Action Drawer */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 block text-left">
              AI Incident Telemetry
            </span>

            {selectedAnomaly && activeProfile ? (
              <div className="space-y-6 text-left flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Inspecting Target</span>
                    <h3 className="text-xs font-black text-white leading-relaxed">"{selectedAnomaly.title}"</h3>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-sky-400 bg-sky-950/40 p-2 rounded-lg border border-sky-900/20 mt-2">
                      <span className="flex items-center gap-1"><Sparkles size={12} /> AI Confidence Rating</span>
                      <span>{selectedAnomaly.confidence}% Accurate</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Geodetic Location</span>
                    <p className="text-[11px] font-semibold text-slate-350 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono">
                      Lat: <span className="text-slate-200">{selectedAnomaly.lat.toFixed(4)}</span><br/>
                      Lng: <span className="text-slate-200">{selectedAnomaly.lng.toFixed(4)}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Observation Context</span>
                    <p className="text-[11px] font-semibold text-slate-350 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850">
                      {selectedAnomaly.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[8px] font-mono text-emerald-450 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={11} className="text-emerald-400 animate-pulse" /> AI Autonomous Routing
                    </span>
                    
                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-750">
                        <img src={activeProfile.workerAvatar} alt={activeProfile.workerName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left space-y-0.5">
                        <p className="text-[10px] font-black text-white">{activeProfile.workerName}</p>
                        <p className="text-[7.5px] font-mono text-emerald-450 uppercase tracking-tight">{activeProfile.workerTitle}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Routed Department</span>
                      <p className="text-[10px] font-bold text-sky-400 bg-sky-950/20 px-2.5 py-1 rounded border border-sky-900/20 truncate">
                        {activeProfile.deptName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">AI Dispatch Explanation</span>
                      <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-900/20 p-2 rounded border border-slate-850">
                        {activeProfile.reason}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleConvertTicket}
                    disabled={ticketStatus[selectedAnomaly.id] || isDispatching}
                    className={`w-full py-3 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                      ticketStatus[selectedAnomaly.id] 
                        ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                        : 'bg-sky-750 hover:bg-sky-650 text-white active:scale-95 disabled:opacity-50'
                    }`}
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-sky-400" />
                        AI Auto-Routing...
                      </>
                    ) : ticketStatus[selectedAnomaly.id] ? (
                      <>
                        <CheckCircle size={14} /> AI Dispatched & Verified
                      </>
                    ) : (
                      <>
                        <Radio size={14} className="animate-pulse" />
                        Auto-Dispatch via Satellite AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-500 text-xs">
                Select an anomaly pin on the map or from logs to inspect orbital details.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
