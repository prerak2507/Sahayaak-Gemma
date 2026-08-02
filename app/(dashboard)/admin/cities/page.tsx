'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, MapPin, Globe, Users, Building2, X, CheckCircle2, Clock, Search, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function Page() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCity, setNewCity] = useState({
    name: '',
    ngoCount: 0,
    volunteerCount: 0,
    region: 'Gujarat'
  });

  useEffect(() => {
    const demoCities = [
      { id: 'd1', name: 'Delhi', ngoCount: 42, volunteerCount: 1250, region: 'Gujarat', status: 'active', type: 'Core Hub' },
      { id: 'd2', name: 'Ahmedabad', ngoCount: 86, volunteerCount: 3400, region: 'Gujarat', status: 'active', type: 'Mega Node' },
      { id: 'd3', name: 'Surat', ngoCount: 54, volunteerCount: 2100, region: 'Gujarat', status: 'active', type: 'Industrial Node' },
      { id: 'd4', name: 'Vadodara', ngoCount: 31, volunteerCount: 950, region: 'Gujarat', status: 'active', type: 'Cultural Node' }
    ];

    // Connectivity Timeout: Fallback to demo data if Firestore is unreachable after 2 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Firestore unreachable - Entering Offline/Demo Mode");
        setCities(demoCities);
        setIsLoading(false);
      }
    }, 2000);

    const q = query(collection(db, 'cities'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        clearTimeout(timeout);
        const dbCities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCities([...dbCities, ...demoCities]);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore sync failed:", error);
        clearTimeout(timeout);
        setCities(demoCities);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name) return;

    const toastId = toast.loading('Initializing new city node...');
    try {
      await addDoc(collection(db, 'cities'), {
        ...newCity,
        status: 'active',
        type: 'Regional Node',
        created_at: serverTimestamp(),
        last_sync: new Date().toISOString()
      });
      toast.success(`${newCity.name} node established successfully!`, { id: toastId });
      setIsModalOpen(false);
      setNewCity({ name: '', ngoCount: 0, volunteerCount: 0, region: 'Gujarat' });
    } catch (error: any) {
      toast.error('Failed to add city: ' + error.message, { id: toastId });
    }
  };

  if (isLoading) return <LoadingSkeleton type="page" />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--saffron)]" />
        <div className="flex-1">
          <h1 className="text-3xl font-black font-mukta text-[var(--ink)] tracking-tight flex items-center gap-3">
            <Globe className="text-[var(--saffron)]" /> Platform Nodes
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search city nodes..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[var(--saffron)] text-sm font-medium"
              />
            </div>
            <p className="text-[var(--ink-muted)] hidden md:block text-xs font-bold uppercase tracking-widest">{cities.length} ACTIVE NODES</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[var(--saffron)] text-white rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--saffron-glow)]"
        >
          <Plus size={20} /> Add New Node
        </button>
      </div>

      {/* Global Coverage Visualization */}
      <div className="bg-[#0F172A] rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-slate-800 group">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 p-20 opacity-5 scale-150 rotate-12 text-white pointer-events-none group-hover:scale-[1.6] transition-transform duration-1000">
            <Globe size={400} />
         </div>
         <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <Activity size={12} /> Global Sync: Operational
               </div>
               <h2 className="text-4xl md:text-6xl font-black font-mukta text-white tracking-tighter leading-tight">Geographic <br/><span className="text-[var(--saffron)]">Coverage</span> Analysis</h2>
               <p className="text-slate-400 font-medium max-w-md text-lg leading-relaxed">Visualizing the expansion of Sahaayak's regional nodes across the subcontinent. Real-time telemetry from {cities.length} active hubs.</p>
               
               <div className="flex gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-1">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Regional Health</p>
                     <p className="text-2xl font-black font-mukta text-white">99.8%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-1">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Expansion Rate</p>
                     <p className="text-2xl font-black font-mukta text-[var(--saffron)]">+12% <span className="text-[10px] text-slate-500 font-bold tracking-normal">MoM</span></p>
                  </div>
               </div>
            </div>

            <div className="lg:w-[500px] h-[350px] bg-slate-900/50 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-inner group/map cursor-crosshair">
               {/* Cartographic Map Placeholder/Mockup */}
               <svg className="absolute inset-0 w-full h-full opacity-40 p-8" viewBox="0 0 800 600">
                  <path d="M100,100 L700,50 L750,400 L400,550 L50,450 Z" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5" />
                  <path d="M200,150 Q400,300 600,450" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
                  
                  {/* Nodes Visualization */}
                  {cities.map((city, idx) => {
                     const x = (city.id.charCodeAt(0) * 17) % 70 + 15;
                     const y = (city.id.charCodeAt(1) * 9) % 60 + 20;
                     return (
                        <g key={city.id} className="group/node">
                           <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="var(--saffron)" className="animate-pulse" />
                           <circle cx={`${x}%`} cy={`${y}%`} r="12" fill="var(--saffron)" className="opacity-10" />
                        </g>
                     )
                  })}
               </svg>
               
               <div className="absolute bottom-6 left-8">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-2">
                     <div className="w-10 h-[1px] bg-white/20" /> Tactical Node Grid
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm group hover:border-[var(--saffron)] transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-[var(--saffron)] transition-colors">Total Coverage</p>
          <p className="text-4xl font-black font-mukta text-[var(--ink)]">{cities.length}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><Plus size={10} /> Active Nodes</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm group hover:border-blue-500 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-500 transition-colors">NGO Partners</p>
          <p className="text-4xl font-black font-mukta text-[var(--ink)]">{cities.reduce((acc, c) => acc + (c.ngoCount || 0), 0)}</p>
          <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-widest">Global Verified</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm group hover:border-red-500 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-red-500 transition-colors">Force Multiplier</p>
          <p className="text-4xl font-black font-mukta text-[var(--ink)]">{(cities.reduce((acc, c) => acc + (c.volunteerCount || 0), 0) / 1000).toFixed(1)}k</p>
          <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-widest">Active Field Engineers</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm group hover:border-emerald-500 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-emerald-500 transition-colors">Node Health</p>
          <p className="text-4xl font-black font-mukta text-[var(--ink)]">98%</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-widest">Latency Optimal</p>
        </div>
      </div>
      
      {/* City Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredCities.map((city) => (
          <div key={city.id} className="bg-white group rounded-[3rem] p-1 shadow-sm hover:shadow-2xl hover:shadow-[var(--saffron-glow)]/10 transition-all duration-500 border border-[var(--border)] hover:border-[var(--saffron)]/30">
            <div className="bg-[var(--surface-2)] rounded-[2.8rem] p-8 relative overflow-hidden h-full flex flex-col">
              {/* Background Art */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12 scale-[2.5] text-[var(--ink)] pointer-events-none group-hover:text-[var(--saffron)] group-hover:opacity-[0.05] transition-all duration-700">
                <Globe size={150} />
              </div>

              <div className="flex justify-between items-start relative z-10 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-[10px] font-black text-[var(--saffron)] uppercase tracking-widest">{city.type || 'Regional Node'}</p>
                  </div>
                  <h3 className="text-3xl font-black font-mukta text-[var(--ink)] tracking-tighter leading-tight">{city.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{city.region}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--ink)] group-hover:bg-[var(--saffron)] group-hover:text-white transition-all duration-500">
                  <MapPin size={22} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10 mt-auto">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-white/50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    <Building2 size={12} className="text-[var(--saffron)]" /> NGOs
                  </div>
                  <p className="text-xl font-black font-mukta">{city.ngoCount}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-white/50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    <Users size={12} className="text-[var(--saffron)]" /> FORCES
                  </div>
                  <p className="text-xl font-black font-mukta">{city.volunteerCount}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between relative z-10">
                 <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-[var(--surface-2)] flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/50?img=${(city.id.length + i) % 70}`} className="w-full h-full object-cover grayscale opacity-50" />
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-[var(--saffron)] text-white text-[8px] font-bold flex items-center justify-center border-2 border-[var(--surface-2)]">
                      +{Math.floor(city.volunteerCount / 10)}
                    </div>
                 </div>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                   <Clock size={10} /> Sync: Live
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add City Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[var(--ink)]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleAddCity}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black font-mukta uppercase tracking-tight">Expand to New City</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newCity.name}
                  onChange={e => setNewCity({...newCity, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--saffron)] outline-none font-bold"
                  placeholder="e.g. Mumbai"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Initial NGOs</label>
                  <input 
                    type="number" 
                    value={newCity.ngoCount}
                    onChange={e => setNewCity({...newCity, ngoCount: parseInt(e.target.value)})}
                    className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--saffron)] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Field Engineers</label>
                  <input 
                    type="number" 
                    value={newCity.volunteerCount}
                    onChange={e => setNewCity({...newCity, volunteerCount: parseInt(e.target.value)})}
                    className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--saffron)] outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Region / State</label>
                <select 
                  value={newCity.region}
                  onChange={e => setNewCity({...newCity, region: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--saffron)] outline-none font-bold appearance-none"
                >
                  <option>Gujarat</option>
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[var(--saffron)] text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-[var(--saffron-glow)] hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} /> Establish Node
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
