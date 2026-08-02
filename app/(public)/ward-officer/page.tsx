'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, AlertTriangle, ShieldCheck, Camera, Send, 
  CheckSquare, Clock, Filter, Sparkles, CheckCircle2, ChevronRight, X, Shield, Bot
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const CivicPulseAI = dynamic(() => import('@/components/shared/CivicPulseAI'), { ssr: false });

interface Incident {
  id: string;
  title: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  timeOpen: string;
  status: 'Open' | 'Dispatched' | 'Resolved';
  assignedTo?: string;
  photoUrl?: string;
}

export default function WardOfficerDashboard() {
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [briefingText, setBriefingText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'dispatched' | 'open'>('all');
  
  // Checklist states
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Inspect storm drains at Judges Bungalow Road', checked: false },
    { id: 2, text: 'Deploy jetting trucks to Ward 6 lowlands', checked: false },
    { id: 3, text: 'Place sandbags at waterlogged spots near lake', checked: false },
    { id: 4, text: 'Distribute standby generator units to pumping stations', checked: false },
    { id: 5, text: 'Send monsoon advisory alert broadcast to residents', checked: false }
  ]);

  // Incidents queues
  const [incidents, setIncidents] = useState<Incident[]>([
    { id: 'inc-p1', title: 'Judges Bungalow Road sewer overflow', category: 'Drainage', urgency: 'high', timeOpen: '3 hours open', status: 'Open' },
    { id: 'inc-p2', title: 'Corporate park entrance major pothole collapse', category: 'Roads', urgency: 'high', timeOpen: '1 day open', status: 'Open' },
    { id: 'inc-p3', title: 'Residential water pipeline burst near Prahladnagar Lake', category: 'Water Supply', urgency: 'high', timeOpen: '4 hours open', status: 'Open' },
    { id: 'inc-p4', title: 'Commercial illegal construction waste pile', category: 'Waste Management', urgency: 'medium', timeOpen: '14 hours open', status: 'Dispatched', assignedTo: 'Ramesh Koli' },
    { id: 'inc-p5', title: 'Footpath encroachment near commercial circle', category: 'Encroachment', urgency: 'medium', timeOpen: '2 days open', status: 'Open' },
    { id: 'inc-p6', title: 'Substation transformer sparking near mall access', category: 'Electricity', urgency: 'critical', timeOpen: '1 hour open', status: 'Open' },
    { id: 'inc-p7', title: 'Streetlight feeder line short circuit on SG Highway', category: 'Electricity', urgency: 'critical', timeOpen: '5 days open', status: 'Open' },
    { id: 'inc-p8', title: 'Traffic divider structural breach on main crossing', category: 'Roads', urgency: 'low', timeOpen: '2 days open', status: 'Open' }
  ]);

  // Dispatch Drawer State
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [crewSize, setCrewSize] = useState(2);
  const [selectedWorker, setSelectedWorker] = useState('PWD Field Engineers');

  // Photo Resolution Modal State
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);

  // Seeding AI briefing on load
  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: "Generate a morning operational briefing for Ward 6 Prahladnagar. Current highlights: transformer sparking (1h open), sewer overflow (3h open), streetlight short circuit (5d open - overdue SLA)."
          })
        });
        const data = await res.json();
        if (data.reply) {
          setBriefingText(data.reply);
        } else {
          throw new Error('No reply');
        }
      } catch (e) {
        setBriefingText(`=== WARD 6 MORNING OPERATIONAL BRIEFING ===
• CRITICAL THREAT: Substation transformer sparking near Prahladnagar Mall. Immediate hazard to public safety. Fire & electrical dispatch priority #1.
• MONSOON WARNING: Heavy rainfall predicted. Sewer overflow on Judges Bungalow Road must be cleared before 18:00 to prevent local flooding.
• SLA ESCALATION: SG Highway streetlight outage is open 5 days. Escalated to senior electrical engineer Vijay Parmar for urgent intervention.
• FIELD METRIC: 8 active cases in queue. Crew utilization is at 84%. Dispatch standby crews.`);
      } finally {
        setLoadingBriefing(false);
      }
    };
    fetchBriefing();
  }, []);

  const handleToggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    toast.success('Pre-monsoon task status updated!', { icon: '✓' });
  };

  const handleQuickDispatch = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const confirmDispatch = () => {
    if (!selectedIncident) return;
    setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { 
      ...inc, 
      status: 'Dispatched',
      assignedTo: selectedWorker 
    } : inc));
    toast.success(`Success: Field Engineer ${selectedWorker} dispatched to ${selectedIncident.title} with a crew of ${crewSize}!`, { icon: '🛠️' });
    setSelectedIncident(null);
  };

  const handleOpenResolve = (incident: Incident) => {
    setResolvingIncident(incident);
    setSimulatedPhoto(null);
  };

  const simulatePhotoUpload = () => {
    const dummyPhotos = [
      'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=60'
    ];
    const picked = dummyPhotos[Math.floor(Math.random() * dummyPhotos.length)];
    setSimulatedPhoto(picked);
    toast.success('Resolution proof uploaded! Ready to submit.', { icon: '📸' });
  };

  const confirmResolution = () => {
    if (!resolvingIncident) return;
    setIncidents(prev => prev.map(inc => inc.id === resolvingIncident.id ? { 
      ...inc, 
      status: 'Resolved',
      photoUrl: simulatedPhoto || undefined
    } : inc));
    toast.success(`Incident: "${resolvingIncident.title}" marked as resolved in central database!`, { icon: '✅' });
    setResolvingIncident(null);
  };

  const filteredIncidents = incidents.filter(inc => {
    if (activeTab === 'all') return true;
    if (activeTab === 'critical') return inc.urgency === 'critical' || inc.urgency === 'high';
    if (activeTab === 'dispatched') return inc.status === 'Dispatched';
    if (activeTab === 'open') return inc.status === 'Open';
    return true;
  });

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-24 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* HEADER BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 mb-8 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.25em] bg-amber-950/80 px-3 py-1 rounded-full border border-amber-900/80">
              Field Command Center
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-mukta text-white mt-2 tracking-tight">
              Ward Officer Operations Room — Ward 6 Prahladnagar
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Daily scheduling, emergency dispatch routing, and citizen validation controls
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 self-end">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Live System Active</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MORNING OPERATIONAL BRIEFING */}
        {/* ========================================================================= */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/50 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Bot size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Morning Operational Briefing</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ahmedabad Smart City Node</p>
              </div>
            </div>

            {loadingBriefing ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-850 border-t-teal-500 animate-spin" />
                <p className="text-slate-400 text-xs font-semibold">Synthesizing daily field telemetries...</p>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl text-xs font-semibold leading-relaxed text-slate-300 whitespace-pre-wrap max-w-4xl">
                {briefingText}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4 LARGE COUNTERS */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Incidents</span>
            <span className="text-3xl font-black text-slate-100 block">8</span>
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/80">Queue Peak</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Critical Urgency</span>
            <span className="text-3xl font-black text-rose-500 block">4</span>
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/80">Immediate Action</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dispatched Crews</span>
            <span className="text-3xl font-black text-teal-400 block">5</span>
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest bg-teal-950/80 px-2 py-0.5 rounded border border-teal-900/80">84% Utilization</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overdue SLA</span>
            <span className="text-3xl font-black text-amber-500 block">2</span>
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/80">Escalated</span>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* TWO COLUMN GRID — INCIDENT LIST vs CHECKLIST */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Incident Queue List */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-extrabold font-mukta text-white">Active Incident Response Queue</h2>
                <p className="text-xs text-slate-400 font-medium">Real-time incident dispatching and resolution gating</p>
              </div>

              <div className="flex gap-2">
                {['all', 'critical', 'dispatched', 'open'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                      activeTab === tab 
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  className={`border rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    inc.status === 'Resolved' ? 'bg-slate-950/40 border-slate-850/60 opacity-60' :
                    inc.status === 'Dispatched' ? 'bg-slate-900/60 border-slate-800' :
                    'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        inc.urgency === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        inc.urgency === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        inc.urgency === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {inc.urgency}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{inc.category}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">{inc.timeOpen}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-200 leading-snug">{inc.title}</h3>
                    
                    {inc.assignedTo && (
                      <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                        Assigned to: {inc.assignedTo}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 self-start md:self-center shrink-0">
                    {inc.status === 'Open' && (
                      <button 
                        onClick={() => handleQuickDispatch(inc)}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                      >
                        Quick Dispatch
                      </button>
                    )}

                    {inc.status === 'Dispatched' && (
                      <button 
                        onClick={() => handleOpenResolve(inc)}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/20 text-slate-300 hover:text-teal-400 text-xs font-bold rounded-xl transition-all"
                      >
                        Resolve with Photo
                      </button>
                    )}

                    {inc.status === 'Resolved' && (
                      <span className="px-4 py-2 bg-emerald-950/80 border border-emerald-900/80 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1">
                        <CheckCircle2 size={12} /> Resolved
                      </span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Daily Checklist Block */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold font-mukta text-white">Daily Operational Checklist</h2>
              <p className="text-xs text-slate-400 font-medium">Pre-monsoon precautionary tasks checklist</p>
            </div>

            <div className="space-y-4">
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start select-none ${
                    item.checked 
                      ? 'bg-emerald-950/10 border-emerald-500/20 opacity-70' 
                      : 'bg-slate-900 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={item.checked}
                    onChange={() => {}} // handled by div onClick
                    className="w-4 h-4 rounded text-teal-600 border-slate-800 bg-slate-950 focus:ring-0 cursor-pointer mt-0.5"
                  />
                  <span className={`text-xs font-semibold leading-relaxed ${item.checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/80 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Checklist Progress</span>
              <div className="flex justify-between items-center text-xs font-bold text-teal-400">
                <span>{checklist.filter(c => c.checked).length} of 5 Completed</span>
                <span>{Math.round((checklist.filter(c => c.checked).length / 5) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500" 
                  style={{ width: `${(checklist.filter(c => c.checked).length / 5) * 100}%` }} 
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK DISPATCH DRAWER / DIALOG */}
      {/* ========================================================================= */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedIncident(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-white">Emergency Crew Dispatch</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Assign Operations Node</p>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 mb-8 text-left">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Incident</p>
                <p className="text-xs font-bold text-slate-200 leading-relaxed mt-1">"{selectedIncident.title}"</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assign Lead Field Technician</label>
                <select 
                  value={selectedWorker} 
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-teal-400 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="PWD Field Engineers">PWD Field Engineers (PWD Field Engineers)</option>
                  <option value="Sohan Prasad">Sohan Prasad (Sewer Jetting Operator)</option>
                  <option value="Vijay Parmar">Vijay Parmar (High Voltage Lineman)</option>
                  <option value="Ramesh Koli">Ramesh Koli (Sanitation Inspector)</option>
                  <option value="Tushar Trivedi">Tushar Trivedi (Pipeline Field Assistant)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Required Crew Size</label>
                <input 
                  type="number" 
                  min="1" 
                  max="6" 
                  value={crewSize} 
                  onChange={(e) => setCrewSize(parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setSelectedIncident(null)} 
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDispatch}
                className="flex-[2] py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHOTO RESOLUTION MODAL */}
      {/* ========================================================================= */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setResolvingIncident(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-white">Resolve with Validation Proof</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Photo Verification Gate</p>
              </div>
              <button 
                onClick={() => setResolvingIncident(null)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 mb-8 text-left">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Incident</p>
                <p className="text-xs font-bold text-slate-200 leading-relaxed mt-1">"{resolvingIncident.title}"</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Upload After-Resolution Proof</label>
                
                {simulatedPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48">
                    <img src={simulatedPhoto} alt="Proof" className="w-full h-40 object-cover" />
                    <button 
                      onClick={() => setSimulatedPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-900 rounded-full text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={simulatePhotoUpload}
                    className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-teal-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-950/40 transition-all cursor-pointer"
                  >
                    <Camera size={24} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Simulate Camera Verification</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setResolvingIncident(null)} 
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmResolution}
                disabled={!simulatedPhoto}
                className="flex-[2] py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CHAT WIDGET */}
      <CivicPulseAI />

    </div>
  );
}
