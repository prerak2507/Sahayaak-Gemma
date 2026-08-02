'use client';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, UserCheck, MessageSquare, Phone, Mail, Award, Clock, X, Shield, Calendar, Sparkles, Brain, Sliders, Activity, Database, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { timeAgo } from '@/lib/utils';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { AnimatePresence } from 'framer-motion';
import { scopeToCity } from '@/lib/data/needs';
import { useNeeds } from '@/lib/data/use-needs';

export default function Page() {
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [activeNeeds, setActiveNeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiScout, setAiScout] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [isAssigningNeedId, setIsAssigningNeedId] = useState<string | null>(null);

  // Real records, read through the server.
  //
  // This screen used to merge a hardcoded roster of five people into whatever
  // the database returned. Those volunteers could not be assigned work, could
  // not be edited, and were the same five names shown on the NGO screen.
  const { needs: boardNeeds } = useNeeds({ assignment: 'all' });

  useEffect(() => {
    setActiveNeeds(boardNeeds.filter((n) => n.status !== 'completed' && n.status !== 'closed'));
  }, [boardNeeds]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/volunteers');
        if (!res.ok) throw new Error(`roster returned ${res.status}`);
        const body = await res.json();
        if (!cancelled) setVolunteers(body.volunteers ?? []);
      } catch (error) {
        console.error('Could not load the volunteer roster:', error);
        if (!cancelled) setVolunteers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 120000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 🤖 Trigger Sovereign AI Scout once both needs and volunteers are ready
  const runAiTalentScout = async () => {
    if (volunteers.length === 0) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/volunteer-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          volunteers: volunteers.slice(0, 8),
          activeNeeds: activeNeeds.slice(0, 5)
        })
      });
      const data = await res.json();
      setAiScout(data);
      toast.success('Sovereign AI Scout strategy synchronized.');
    } catch (err) {
      console.error(err);
      toast.error('AI Scout initialization failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (volunteers.length > 0 && !aiScout && !isAiLoading) {
      runAiTalentScout();
    }
  }, [volunteers, activeNeeds]);

  const handleAssignVolunteerToNeed = async (volunteerId: string, volunteerName: string, needId: string) => {
    try {
      const targetNeed = activeNeeds.find(n => n.id === needId);
      if (!targetNeed) return;

      const promise = new Promise(async (resolve, reject) => {
        try {
          // Update the need document in firestore with the assigned volunteer
          const needRef = doc(db, 'needs', needId);
          await updateDoc(needRef, {
            assigned_volunteer_id: volunteerId,
            assigned_volunteer_name: volunteerName,
            status: 'in_progress' // transition status directly to in_progress on dispatch
          });

          // Create a task record
          const taskRef = doc(collection(db, 'tasks'));
          await setDoc(taskRef, {
            id: taskRef.id,
            need_id: needId,
            volunteer_id: volunteerId,
            volunteer_name: volunteerName,
            need_title: targetNeed.title,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            authority: 'government_requisition'
          });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });

      toast.promise(promise, {
        loading: `Requisitioning ${volunteerName}...`,
        success: `Successfully assigned ${volunteerName} to "${targetNeed.title}"!`,
        error: 'Failed to assign field engineer.'
      });

      setIsAssigningNeedId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    v.ngo_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton type="page" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-800 p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Sovereign Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 shadow-lg shadow-slate-100/50 backdrop-blur-md p-6 rounded-[2rem] relative z-10">
        <div>
          <span className="text-[9px] font-mono text-blue-650 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Sliders size={12} className="text-blue-600 animate-spin" /> City OFFICIAL CONTROL DECK
          </span>
          <h1 className="text-3xl font-black font-mukta text-slate-850 tracking-tight mt-1 flex items-center gap-2">
            🛡️ Field Engineer Control Center
          </h1>
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
            Sovereign district-wide oversight, AI talent deployment, and NGO field engineer dispatch orchestration.
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name, skill, NGO..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold shadow-sm" 
             />
          </div>
          <button 
            onClick={runAiTalentScout}
            disabled={isAiLoading}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center justify-center text-blue-600 disabled:opacity-50"
            title="Recalculate AI Matches"
          >
            <RefreshCw size={18} className={isAiLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SOVEREIGN AI STRATEGIC PANEL */}
      <div className="bg-[#0F172A] rounded-[2rem] p-8 text-white relative overflow-hidden border border-slate-800 shadow-2xl z-10">
         <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 scale-150"><Brain size={120} /></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
               <div className="flex items-center gap-3 text-blue-400 mb-2">
                  <Sparkles size={24} className="animate-pulse" />
                  <h2 className="text-lg font-black uppercase tracking-widest font-mukta !text-white">AI Field Engineer Talent Scout</h2>
               </div>
               <p className="text-slate-350 font-medium text-base leading-relaxed italic border-l-2 border-blue-500 pl-4">
                  {isAiLoading ? 'Synthesizing district needs and field engineer competencies...' : aiScout?.strategy || 'Analyzing ward-level field engineer capacity and emergency hotspots...'}
               </p>
               
               <div className="flex flex-wrap gap-4 pt-4">
                  {aiScout?.matches?.slice(0, 3).map((m: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3.5">
                       <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">{m.volunteerName[0]}</div>
                       <div>
                          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Strategic Placement</p>
                          <p className="text-xs font-bold text-slate-200">{m.volunteerName} → {m.needTitle.slice(0,25)}...</p>
                       </div>
                    </div>
                  ))}
                  {(aiScout?.matches?.length === 0 || !aiScout) && (
                    <p className="text-xs text-slate-500 italic">No urgent tactical placements required.</p>
                  )}
               </div>
            </div>
            
            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-blue-450" /> Strategic District Skill Gaps
               </h3>
               <div className="space-y-2">
                  {(aiScout?.gaps || ["No critical gaps recorded."]).map((gap: string) => (
                    <div key={gap} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> {gap}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Grid of Field Engineer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {filteredVolunteers.map(v => (
          <div key={v.id} className="bg-white/90 border border-slate-200 shadow-md hover:shadow-xl hover:border-blue-400 transition-all p-6 rounded-[2rem] flex flex-col justify-between group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 opacity-40 translate-x-10 -translate-y-10 rounded-full" />
             
             <div>
               <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                      <img src={`https://i.pravatar.cc/150?img=${v.id}`} className="w-16 h-16 rounded-2xl shadow-md group-hover:scale-105 transition-transform object-cover border border-slate-100" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${v.status === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${v.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {v.status}
                    </span>
                    <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest">
                      🏢 {v.ngo_name}
                    </span>
                  </div>
               </div>
               
               <h3 className="text-xl font-bold font-mukta text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{v.name}</h3>
               
               <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-bold mb-4">
                  <Star size={12} fill="currentColor" /> {v.rating.toFixed(1)} <span className="text-slate-400 font-normal ml-1">({v.hours} hrs contributed)</span>
               </div>
  
               <div className="flex flex-wrap gap-1.5 mb-6">
                  {v.skills.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[9px] font-bold uppercase text-slate-500 tracking-wider">{s}</span>
                  ))}
               </div>
             </div>

             <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedVolunteer(v)} 
                    className="py-2 rounded-xl border border-slate-200 text-xs font-black uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm text-slate-700"
                  >
                     Review Profile
                  </button>
                  <button 
                    onClick={() => setIsAssigningNeedId(isAssigningNeedId === v.id ? null : v.id)} 
                    className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1"
                  >
                    <UserCheck size={14} /> Sovereign Dispatch
                  </button>
                </div>

                {/* Requisition Task Drawer inside Card */}
                {isAssigningNeedId === v.id && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-200">
                    <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest flex justify-between">
                      Requisition to Ward Emergency:
                      <button onClick={() => setIsAssigningNeedId(null)} className="text-red-500"><X size={10} /></button>
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {activeNeeds.map((need) => (
                        <button
                          key={need.id}
                          onClick={() => handleAssignVolunteerToNeed(v.id, v.name, need.id)}
                          className="w-full p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-left text-[10px] font-bold flex justify-between items-center transition-colors"
                        >
                          <span className="truncate">{need.title}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex-shrink-0 ml-1">Dispatch</span>
                        </button>
                      ))}
                      {activeNeeds.length === 0 && (
                        <p className="text-[9px] text-slate-400 italic text-center py-2">No active needs to resolve.</p>
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* COMPREHENSIVE SOVEREIGN PROFILE MODAL */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedVolunteer(null)} />
           <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in slide-in-from-bottom-8 duration-500">
              
              {/* Left Panel: Identity */}
              <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col items-center justify-between text-center border-r border-slate-200">
                 <div className="flex flex-col items-center">
                   <div className="relative mb-6">
                      <img src={`https://i.pravatar.cc/150?img=${selectedVolunteer.id}`} className="w-32 h-32 rounded-[40px] shadow-2xl border-4 border-white object-cover" />
                      <div className="absolute -bottom-2 right-2 bg-white p-2.5 rounded-2xl shadow-lg text-blue-600"><Shield size={20} /></div>
                   </div>
                   <h2 className="text-2xl font-bold font-mukta leading-tight mb-1">{selectedVolunteer.name}</h2>
                   <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-200">Affiliation: {selectedVolunteer.ngo_name}</span>
                 </div>
                 
                 <div className="w-full space-y-3 mt-6">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="text-xl font-bold text-slate-800">{selectedVolunteer.hours}h</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contributed Hours</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="text-xl font-bold text-slate-800">{selectedVolunteer.rating.toFixed(1)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Skill Competency Rating</p>
                    </div>
                 </div>
              </div>

              {/* Right Panel: Content */}
              <div className="md:w-2/3 p-8 md:p-10 flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between items-center mb-6">
                     <span className="text-[10px] font-mono text-blue-600 font-extrabold uppercase tracking-widest">COGNITIVE COMPLIANCE PROFILE</span>
                     <button onClick={() => setSelectedVolunteer(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-650 font-bold transition-colors">&times;</button>
                   </div>
                   
                   <div className="space-y-6">
                      <section>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">Platform Narrative</h4>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{selectedVolunteer.bio}"</p>
                      </section>
  
                      <section className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> Contact Terminal</h4>
                              <p className="text-xs font-bold text-slate-800">{selectedVolunteer.phone}</p>
                          </div>
                          <div className="space-y-1 p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Mail size={10} /> Secure Email</h4>
                              <p className="text-xs font-bold text-slate-800 truncate">{selectedVolunteer.email}</p>
                          </div>
                      </section>
  
                      <section>
                          <h4 className="text-xs font-black text-slate-405 uppercase tracking-widest mb-2.5">Endorsed Competencies</h4>
                          <div className="flex flex-wrap gap-2">
                              {selectedVolunteer.skills.map((s: string) => (
                                  <span key={s} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200">{s}</span>
                              ))}
                          </div>
                      </section>
  
                      <section>
                          <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-2.5">State Recognition & Badges</h4>
                          <div className="flex flex-wrap gap-2">
                              {selectedVolunteer.badges.map((b: string) => (
                                  <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[9px] font-black border border-blue-100 tracking-wider">
                                      <Award size={12} /> {b.toUpperCase()}
                                  </span>
                              ))}
                          </div>
                      </section>
                   </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-150 flex gap-4 items-center">
                    <button 
                      onClick={() => { 
                        setSelectedVolunteer(null); 
                        setIsAssigningNeedId(selectedVolunteer.id);
                        toast.success('Select a ward emergency task to dispatch.'); 
                      }} 
                      className="flex-1 py-3.5 bg-blue-650 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all active:scale-95 text-xs text-center"
                    >
                      Dispatch Task
                    </button>
                    <button 
                      onClick={() => { setActiveChat(selectedVolunteer); setSelectedVolunteer(null); }} 
                      className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-90"
                      title="Open Secure Radio Feed"
                    >
                       <MessageSquare size={20} />
                    </button>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-auto">
                       <Clock size={12} /> Sync: {selectedVolunteer.lastActive}
                    </div>
                 </div>
              </div>

           </div>
        </div>
      )}

      {/* Real-time Chat Interface */}
      <AnimatePresence>
        {activeChat && (
          <ChatInterface 
            targetUserId={activeChat.id} 
            targetUserName={activeChat.name} 
            onClose={() => setActiveChat(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
