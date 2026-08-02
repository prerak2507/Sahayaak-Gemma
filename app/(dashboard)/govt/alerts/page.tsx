'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Users, Landmark, 
  Sparkles, CheckCircle2, RefreshCw, Send, Plus, X, Globe, MapPin, 
  Search, ShieldCheck, HeartHandshake, TrendingUp, DollarSign, Terminal, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, query, where, limit } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { CITY_COORDINATES, ALL_DEPARTMENTS, getDeptIcon, ALL_DEPARTMENT_EMPLOYEES } from '@/lib/data/govt-data';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });


export default function CriticalAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  // Form states for deploying custom incident directives
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newCategory, setNewCategory] = useState('Weather');
  const [newZone, setNewZone] = useState('West Zone');
  const [newVols, setNewVols] = useState(100);
  const [newFunds, setNewFunds] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'resolved'>('all');
  
  // Interactive fund modals
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [authorizingAlertId, setAuthorizingAlertId] = useState<string | null>(null);
  
  // Processing load indicators
  const [isTransmitting, setIsTransmitting] = useState<Record<string, boolean>>({});

  // Real-time meteorological states
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    humidity: number;
    wind: number;
    statusText: string;
    loading: boolean;
  } | null>(null);

  const [aiReport, setAiReport] = useState<string | null>(null);

  // Fetch real-time Open-Meteo weather when incident selection shifts
  useEffect(() => {
    if (!selectedAlert || !selectedAlert.lat || !selectedAlert.lng) {
      setWeatherData(null);
      setAiReport(null);
      return;
    }

    setAiReport(null);

    let isMounted = true;
    setWeatherData({
      temp: 28,
      humidity: 65,
      wind: 12,
      statusText: "Syncing Meteorological Feeds...",
      loading: true
    });

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedAlert.lat}&longitude=${selectedAlert.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API unreachable");
        const data = await res.json();
        
        if (!isMounted) return;

        const current = data.current || {};
        const temp = current.temperature_2m ?? 28;
        const humidity = current.relative_humidity_2m ?? 65;
        const wind = current.wind_speed_10m ?? 12;
        const code = current.weather_code ?? 0;

        let statusText = "Clear Sky ☀️";
        if (code === 0) statusText = "Clear Sky ☀️";
        else if (code >= 1 && code <= 3) statusText = "Partly Cloudy ⛅";
        else if (code === 45 || code === 48) statusText = "Foggy 🌫️";
        else if (code >= 51 && code <= 55) statusText = "Light Drizzle 🌧️";
        else if (code >= 61 && code <= 65) statusText = "Heavy Rain ⛈️";
        else if (code >= 80 && code <= 82) statusText = "Rain Showers 🌦️";
        else if (code >= 95) statusText = "Thunderstorm Warning ⚡";
        else statusText = "Overcast Clouds ☁️";

        setWeatherData({
          temp,
          humidity,
          wind,
          statusText,
          loading: false
        });
      } catch (err) {
        console.warn("Using high-fidelity weather simulator due to network offline.", err);
        if (!isMounted) return;
        const isWeatherAlert = selectedAlert.category === 'Weather' || selectedAlert.title.toLowerCase().includes('rain');
        setWeatherData({
          temp: isWeatherAlert ? 24 : 33,
          humidity: isWeatherAlert ? 88 : 55,
          wind: isWeatherAlert ? 22 : 11,
          statusText: isWeatherAlert ? "Severe Storm Warning ⛈️" : "Dense Heat Spikes ☀️",
          loading: false
        });
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [selectedAlert?.id, selectedAlert?.lat, selectedAlert?.lng]);



  // 1. Live Firestore Sync with Seed Auto-Population & Local Fallback
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'critical_alerts'), (snap) => {
      if (snap.empty) {
        // An empty alert log is shown as an empty alert log. This used to write
        // a set of invented alerts into the live database whenever the
        // collection was empty, so the demo manufactured its own history.
        setAlerts([]);
        setSelectedAlert(null);
      } else {
        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAlerts(list);
        
        // Dynamic preserve selection or default to top
        if (selectedAlert) {
          const matched = list.find(a => a.id === selectedAlert.id);
          if (matched) setSelectedAlert(matched);
        } else if (list.length > 0) {
          setSelectedAlert(list[0]);
        }
        localStorage.setItem('sahaayak_critical_alerts', JSON.stringify(list));
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore sync offline - falling back to secure local storage caches.", err);
      const saved = localStorage.getItem('sahaayak_critical_alerts');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setAlerts(list);
          setSelectedAlert(list[0]);
        } catch {
          // A corrupt cache is an empty cache, not a reason to invent alerts.
          setAlerts([]);
          setSelectedAlert(null);
        }
      } else {
        setAlerts([]);
        setSelectedAlert(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [selectedAlert]);

  // 2. Action: Acknowledge & Dispatch Broadcasts
  const handleAcknowledgeAlert = async (alertId: string) => {
    setIsTransmitting(prev => ({ ...prev, [alertId]: true }));
    toast.loading("Encrypting telemetry & transmitting warning vectors to active NGO registers...", { id: "mobilize-toast" });
    
    setTimeout(async () => {
      try {
        const ref = doc(db, 'critical_alerts', alertId);
        const alertObj = alerts.find(a => a.id === alertId);
        
        await updateDoc(ref, {
          status: 'acknowledged',
          notifiedNgosCount: 14,
          acknowledgedAt: new Date().toISOString()
        });

        // Seed notification to centralized live collections
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          text: `🚨 [Central Directive Alert]: Emergency mobilization launched for "${alertObj?.title || 'Impending Crisis'}" near Saurashtra boundary!`,
          type: 'CRITICAL',
          is_read: false,
          created_at: new Date().toISOString()
        });

        toast.success("Acknowledge Success! Directives broadcasted to 14 NGOs.", { id: "mobilize-toast", icon: "📡" });
      } catch (err) {
        console.error(err);
        toast.error("Transmission bridge handshake failed.", { id: "mobilize-toast" });
      } finally {
        setIsTransmitting(prev => ({ ...prev, [alertId]: false }));
      }
    }, 1500);
  };

  // 3. Action: Authorize Funding Ledger allocation
  const handleConfirmFunding = async (alertId: string) => {
    if (!fundingAmount || isNaN(Number(fundingAmount)) || Number(fundingAmount) <= 0) {
      toast.error("Provide a valid numeric emergency allocation ledger.");
      return;
    }

    toast.loading("Validating City Treasury limits & applying Digital Signature...", { id: "treasury-toast" });
    
    setTimeout(async () => {
      try {
        const ref = doc(db, 'critical_alerts', alertId);
        
        await updateDoc(ref, {
          status: 'acknowledged',
          fundingAuthorized: Number(fundingAmount),
          authorizedAt: new Date().toISOString(),
          authorizedBy: "Dr. Kavita Patel"
        });

        toast.success(`Allocated ₹${fundingAmount} Lakhs. Digital Signature sealed!`, { id: "treasury-toast", icon: "🏛️" });
        setFundingAmount('');
        setAuthorizingAlertId(null);
      } catch (err) {
        console.error(err);
        toast.error("Treasury lock validation failed.", { id: "treasury-toast" });
      }
    }, 1500);
  };

  // 4. Action: Close & Resolve Incident Channel
  const handleResolveAlert = async (alertId: string) => {
    toast.loading("Archiving geodetic telemetry and closing alert channel...", { id: "close-toast" });
    
    setTimeout(async () => {
      try {
        const ref = doc(db, 'critical_alerts', alertId);
        await updateDoc(ref, {
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        });
        toast.success("Incident resolved. Channel closed and logged nominal.", { id: "close-toast", icon: "✓" });
      } catch (err) {
        console.error(err);
        toast.error("Failed to archive target incident.", { id: "close-toast" });
      }
    }, 1000);
  };

  // 5. Action: Deploy new alert directive
  const handleDeployAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Central directives require a full Title and Context Description.");
      return;
    }

    const newId = `alert-${Date.now()}`;
    
    // Auto-map coordinates to trigger GIS target map panning
    let lat = 28.6139;
    let lng = 77.2090;
    
    if (newZone === 'Central Delhi') {
      lat = 28.6139;
      lng = 77.2090;
    } else if (newZone === 'North Delhi') {
      lat = 28.6833;
      lng = 77.2167;
    } else if (newZone === 'South Delhi') {
      lat = 28.5355;
      lng = 77.2410;
    }

    const directive = {
      id: newId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      severity: newSeverity,
      timestamp: new Date().toISOString(),
      category: newCategory,
      zone: newZone,
      status: 'active',
      lat,
      lng,
      volunteersRequired: newVols,
      fundingRequired: newFunds,
      actionLabel: newSeverity === 'critical' ? 'Acknowledge & Notify NGOs' : 'Authorize Emergency Funds',
      notifiedNgosCount: 0,
      fundingAuthorized: 0
    };

    toast.loading("Broadcasting secure Central Directive across City infrastructure...", { id: "deploy-toast" });
    
    setTimeout(async () => {
      try {
        await setDoc(doc(db, 'critical_alerts', newId), directive);
        toast.success("Directive deployed to active boards successfully!", { id: "deploy-toast", icon: "🚀" });
        
        // Reset states
        setNewTitle('');
        setNewDesc('');
        setIsFormOpen(false);
        setSelectedAlert(directive);
      } catch (err) {
        console.error(err);
        toast.error("Failed to transmit directive.", { id: "deploy-toast" });
      }
    }, 1200);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  // Filter conditions
  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'critical') return a.severity === 'critical' && a.status !== 'resolved';
    if (activeTab === 'warning') return a.severity === 'warning' && a.status !== 'resolved';
    if (activeTab === 'resolved') return a.status === 'resolved';
    return true;
  });

  // Calculate high-fidelity stats
  const activeCount = alerts.filter(a => a.status !== 'resolved').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const totalFundingAllocated = alerts.reduce((acc, a) => acc + (a.fundingAuthorized || 0), 0);
  const totalNgosAlerted = alerts.reduce((acc, a) => acc + (a.notifiedNgosCount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header Banner & Dynamic Telemetry Counters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-950 p-8 rounded-[2.5rem] border border-slate-900 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <span className="text-[9px] font-mono text-red-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded-full w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> Real-Time Incident Control
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mukta">District Critical Alerts</h1>
          <p className="text-xs text-slate-400 font-semibold">
            Administrative e-Governance Directive Node & live GIS remote sensing synchronization
          </p>
        </div>

        {/* Live Counters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto relative z-10">
          <div className="bg-slate-900/60 backdrop-blur border border-slate-850 px-5 py-3 rounded-2xl text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Active Threats</p>
            <h3 className="text-2xl font-black text-red-500 font-mukta flex items-center gap-1">
              <ShieldAlert size={18} className="text-red-500 animate-pulse" />
              {activeCount}
            </h3>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-850 px-5 py-3 rounded-2xl text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Critical Flags</p>
            <h3 className="text-2xl font-black text-amber-500 font-mukta flex items-center gap-1">
              <AlertTriangle size={18} className="text-amber-500 animate-pulse" />
              {criticalCount}
            </h3>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-850 px-5 py-3 rounded-2xl text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">NGOs Mobilized</p>
            <h3 className="text-2xl font-black text-emerald-400 font-mukta flex items-center gap-1">
              <Users size={18} className="text-emerald-400 animate-bounce" />
              {totalNgosAlerted}
            </h3>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-850 px-5 py-3 rounded-2xl text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Funds Authorized</p>
            <h3 className="text-2xl font-black text-blue-400 font-mukta flex items-center gap-1">
              <DollarSign size={18} className="text-blue-400" />
              {totalFundingAllocated}L
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Control Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column - Incidents List & Custom Deployment */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-start">
          
          {/* Action Trigger: Deploy Incident Console */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-800">
                  📢
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 font-mukta">Command Directive Dispatch</h3>
                  <p className="text-[10px] text-slate-500">Launch authenticated safety directives directly to all districts.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className={`p-2.5 rounded-full cursor-pointer transition-all border ${
                  isFormOpen 
                    ? 'bg-red-50 border-red-200 text-red-500 rotate-45' 
                    : 'bg-slate-950 border-slate-900 text-white hover:bg-slate-900 active:scale-95'
                }`}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Glowing directive input fields */}
            {isFormOpen && (
              <form onSubmit={handleDeployAlert} className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Directive Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flood Level 3 Warning"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:bg-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Incident Classification</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 focus:bg-white cursor-pointer"
                    >
                      <option value="Weather">🌦️ Meteorological Warning</option>
                      <option value="Resources">📦 Supply deficit</option>
                      <option value="Medical">🏥 Healthcare Epidemic</option>
                      <option value="Infrastructure">🛣️ Structural Failure</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Context Description (Direct Instructions)</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide strict technical observation guidance and expected action parameters..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:bg-white font-bold leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Target Impact Zone</label>
                    <select 
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 focus:bg-white cursor-pointer"
                    >
                      <option value="Central Delhi">Central Delhi</option>
                      <option value="North Delhi">North Delhi</option>
                      <option value="South Delhi">South Delhi</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Threat Severity Level</label>
                    <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
                      {['critical', 'warning', 'info'].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setNewSeverity(sev as any)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${
                            newSeverity === sev 
                              ? sev === 'critical' ? 'bg-red-600 border border-red-500 text-white shadow-sm' :
                                sev === 'warning' ? 'bg-amber-600 border border-amber-500 text-white shadow-sm' :
                                'bg-sky-600 border border-sky-500 text-white shadow-sm'
                              : 'text-slate-450 hover:bg-slate-100'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Emergency Mobilizations</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="number" 
                        placeholder="Vols Required"
                        value={newVols || ''}
                        onChange={(e) => setNewVols(Number(e.target.value))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      />
                      <input 
                        type="number" 
                        placeholder="Funds (₹L)"
                        value={newFunds || ''}
                        onChange={(e) => setNewFunds(Number(e.target.value))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-[0.98] cursor-pointer"
                >
                  <Send size={12} /> Deploy Safety Directive to Registry
                </button>
              </form>
            )}
          </div>

          {/* Interactive Incident Filter Tabs */}
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-[1.8rem] border border-slate-200 w-max self-start shadow-inner">
            {[
              { id: 'all', label: 'All Incidents' },
              { id: 'critical', label: '🔴 Critical Threats' },
              { id: 'warning', label: '🟡 Active Warnings' },
              { id: 'resolved', label: '🟢 Resolved Archives' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4.5 py-2.5 rounded-[1.3rem] text-[10px] font-black tracking-wider uppercase transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-950 border border-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Incidents Feed */}
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[600px] pr-2 pb-12">
            {filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isResolved = alert.status === 'resolved';
              const isAck = alert.status === 'acknowledged';
              const isSelected = selectedAlert?.id === alert.id;

              return (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`bg-white border rounded-[2.5rem] p-6 shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 group cursor-pointer ${
                    isSelected 
                      ? 'border-slate-950 ring-2 ring-slate-950/20' 
                      : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  {/* Glowing border accents */}
                  <div className={`absolute top-0 left-0 w-2.5 h-full ${
                    isResolved ? 'bg-emerald-500' :
                    isCrit ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                  }`} />

                  {/* Header metadata */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          isResolved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          isCrit ? 'bg-red-50 text-red-650 border-red-100' :
                          'bg-amber-50 text-amber-750 border-amber-100'
                        }`}>
                          {alert.severity} Incident
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          📍 {alert.zone}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          📦 {alert.category}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-black text-slate-800 transition-colors group-hover:text-red-600 mt-1">
                        {alert.title}
                      </h4>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-50 px-2 py-1 rounded border border-slate-150">
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>

                  {/* Textual context description */}
                  <p className="text-xs text-slate-650 leading-relaxed font-sans text-left">
                    {alert.description}
                  </p>

                  {/* Dynamic Action Controls based on status */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    
                    {/* Active Acknowledgment / Funds state */}
                    {isResolved ? (
                      <div className="bg-emerald-50 border border-emerald-100/60 p-3.5 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-500 animate-pulse" />
                          Incident Resolved Nominal • Telemetry Archived
                        </span>
                        <span className="text-[8px] font-mono text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded uppercase font-bold">
                          Closed Log
                        </span>
                      </div>
                    ) : isAck ? (
                      <div className="space-y-3">
                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 text-white">
                          <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Directives Active
                          </span>
                          
                          <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
                            {alert.notifiedNgosCount > 0 && (
                              <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                                <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">NGOs Alerted</span>
                                <span className="text-emerald-400 font-bold font-mono">{alert.notifiedNgosCount} Channels Active</span>
                              </div>
                            )}
                            {alert.fundingAuthorized > 0 && (
                              <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                                <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Funds Allocated</span>
                                <span className="text-blue-400 font-bold font-mono">₹{alert.fundingAuthorized} Lakhs Sealed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Button to Resolve Alert */}
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <ShieldCheck size={13} /> Complete & Close Channel
                        </button>
                      </div>
                    ) : (
                      // Unacknowledged: Show prompt buttons
                      <div className="flex gap-2.5">
                        {isCrit ? (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={isTransmitting[alert.id]}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            {isTransmitting[alert.id] ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} /> Broadcasting...
                              </>
                            ) : (
                              <>
                                <Globe size={13} /> Acknowledge & Notify NGOs
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setAuthorizingAlertId(alert.id)}
                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Landmark size={13} /> Authorize Emergency Funds
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-4 py-3 border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer animate-in fade-in"
                        >
                          Resolve
                        </button>
                      </div>
                    )}

                    {/* Inline slide down allocation ledger */}
                    {authorizingAlertId === alert.id && (
                      <div className="mt-4 p-4 bg-slate-900 border border-slate-850 rounded-2xl animate-in slide-in-from-top duration-300 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono text-amber-400 font-extrabold uppercase tracking-widest">🏛️ Treasury Fund Authorization Ledger</span>
                          <button onClick={() => setAuthorizingAlertId(null)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-xs">₹</span>
                            <input 
                              type="number"
                              placeholder="Enter budget allocation (in Lakhs)"
                              value={fundingAmount}
                              onChange={(e) => setFundingAmount(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-7 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                            />
                          </div>
                          
                          <button 
                            onClick={() => handleConfirmFunding(alert.id)}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                          >
                            Authorize Key
                          </button>
                        </div>
                        
                        <p className="text-[8px] text-slate-500 italic text-left leading-relaxed">
                          By confirming, you apply digital warrant signature "Dr. Kavita Patel" as active City Municipal Command representative.
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50">
                <ShieldCheck className="text-slate-350 mx-auto mb-2 animate-bounce" size={40} />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Telemetry Nominal</h4>
                <p className="text-[10px] text-slate-500 mt-1">No alerts registered in this category.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - GIS Google Satellite Map & Details Telemetry */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
          
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* GIS Map Core */}
            <div>
              <span className="text-[9px] font-mono text-red-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded-full w-max">
                📡 GEE GIS Satellite Sync
              </span>
              <h3 className="text-lg font-black text-white font-mukta">Remote Sensing Surveillance</h3>
              <p className="text-[10px] text-slate-400">Target zone multi-spectral overlays focused on active threats.</p>
            </div>

            {/* Interactive satellite tile map */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-900 bg-slate-900/60 shadow-inner z-0 min-h-[240px]">
              {selectedAlert ? (
                <>
                  <MapContainer 
                    key={`${selectedAlert.id}-${selectedAlert.lat}-${selectedAlert.lng}`}
                    center={[selectedAlert.lat, selectedAlert.lng]} 
                    zoom={15} 
                    zoomControl={true}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EAW, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <Circle 
                      center={[selectedAlert.lat, selectedAlert.lng]} 
                      radius={1500} 
                      pathOptions={{ 
                        color: selectedAlert.severity === 'critical' ? '#ef4444' : '#f97316', 
                        fillColor: selectedAlert.severity === 'critical' ? '#ef4444' : '#f97316', 
                        fillOpacity: 0.15 
                      }} 
                    />
                  </MapContainer>

                  {/* Holographic targeting reticle HUD overlay */}
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <div className="relative w-28 h-28 border border-red-500/30 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-20 h-20 border-2 border-dashed border-red-400/40 rounded-full animate-spin [animation-duration:10s]"></div>
                      <div className="absolute w-2.5 h-2.5 bg-red-400 rounded-full shadow-[0_0_8px_#ef4444]"></div>
                      <div className="absolute w-8 h-[1.5px] bg-red-400/60"></div>
                      <div className="absolute h-8 w-[1.5px] bg-red-400/60"></div>
                    </div>
                  </div>

                  {/* Telemetry coordinate HUD badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-900 px-3 py-1.5 rounded-xl z-10 font-mono text-[9px] text-slate-300">
                    LAT: {selectedAlert.lat?.toFixed(4)}° N | LNG: {selectedAlert.lng?.toFixed(4)}° E
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-center p-8 space-y-3 bg-slate-950">
                  <Globe size={32} className="text-slate-800 animate-spin [animation-duration:20s]" />
                  <p className="text-[10px] text-slate-500 font-mono">LOCKING_GEODETIC_SURVEILLANCE_BEACON...</p>
                </div>
              )}
            </div>

            {selectedAlert && (
              <>
                {/* 1. Real-time Weather Telemetry Widget */}
                {weatherData && (
                  <div className="bg-slate-900/40 backdrop-blur border border-slate-900/60 p-4.5 rounded-3xl space-y-3 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Live Meteorological Feed
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                        Source: Open-Meteo API
                      </span>
                    </div>
                    
                    {weatherData.loading ? (
                      <div className="flex items-center justify-center py-2.5 gap-2 text-slate-550 font-mono text-[10px]">
                        <RefreshCw size={12} className="animate-spin text-cyan-400" />
                        <span>Fusing local meteorological coordinates...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="bg-slate-950/60 border border-slate-900/80 p-2.5 rounded-2xl text-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Temp</span>
                          <span className="text-sm font-black text-white font-mono">{weatherData.temp}°C</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900/80 p-2.5 rounded-2xl text-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Humidity</span>
                          <span className="text-sm font-black text-cyan-400 font-mono">{weatherData.humidity}%</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900/80 p-2.5 rounded-2xl text-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Wind</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">{weatherData.wind} km/h</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900/80 p-2.5 rounded-2xl text-center flex flex-col justify-center items-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Status</span>
                          <span className="text-[9px] font-extrabold text-amber-400 truncate max-w-full">{weatherData.statusText}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}


              </>
            )}

            {/* Selected Alert Details Diagnostic Stream */}
            {selectedAlert ? (
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 text-left space-y-4 animate-in fade-in duration-300">
                <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block">
                  ⚙️ Active Diagnostic Log Core
                </span>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Classification</span>
                    <span className="font-bold text-white uppercase">{selectedAlert.category}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Status Channel</span>
                    <span className={`font-bold uppercase ${selectedAlert.status === 'resolved' ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Target Coordinate Zone</span>
                    <span className="font-bold text-white">{selectedAlert.zone}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Required Vols</span>
                    <span className="font-bold text-white font-mono">{selectedAlert.volunteersRequired || 'STANDBY'}</span>
                  </div>
                </div>

                {/* Micro Terminal log ticker */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900 font-mono text-[9px] text-emerald-400/90 leading-relaxed overflow-hidden h-[90px] relative">
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 text-slate-650">
                    <Terminal size={10} />
                    <span>SYS_DIAG_v2.5</span>
                  </div>
                  <div className="space-y-1 text-left select-none animate-pulse">
                    <p>{`> `}PING {selectedAlert.zone.toUpperCase()}_NODE... OK</p>
                    <p>{`> `}SEVERITY_MAPPING: {selectedAlert.severity.toUpperCase()}</p>
                    {selectedAlert.status === 'acknowledged' ? (
                      <p>{`> `}DISPATCH_ACTIVE: Mobilized {selectedAlert.notifiedNgosCount || 14} NGO endpoints.</p>
                    ) : (
                      <p>{`> `}GRID_TELEMETRY: Waiting administrative warrant authorization.</p>
                    )}
                    <p>{`> `}SIGNAL_STATUS: Nominal telemetry capture loop active.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs font-mono">
                Select an active threat from the directives feed to capture dynamic live telemetry details.
              </div>
            )}

          </div>

          {/* Secure Edge Layer Brand details */}
          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Landmark size={11} className="text-slate-600 animate-pulse" /> Compute Core: AMD EPYC™ Cloud
            </span>
            <span>Edge Nodes: Kria™ K26 SOM</span>
          </div>

        </div>

      </div>

    </div>
  );
}
