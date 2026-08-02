'use client';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, UserCheck, MessageSquare, Phone, Mail, Award, Clock, X, Shield, Calendar, Sparkles, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { timeAgo } from '@/lib/utils';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const { user } = useAuthStore();
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiScout, setAiScout] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);

  // Real records, scoped to this coordinator's organisation.
  //
  // Previously a hardcoded roster was filtered by a name inferred from the
  // signed-in email, so the same five invented people appeared for every NGO.
  useEffect(() => {
    let cancelled = false;

    const email = user?.email || '';
    const organisation = email.includes('asha')
      ? 'Asha Relief'
      : email.includes('disha')
        ? 'Disha Foundation'
        : 'Disha Foundation';

    const load = async () => {
      try {
        const res = await fetch(`/api/volunteers?organisation=${encodeURIComponent(organisation)}`);
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
  }, [user?.email]);

  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) return <LoadingSkeleton type="page" />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Field Engineer Network</h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Manage verified profiles and optimize deployment logistics.</p>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
           <input 
             type="text" 
             placeholder="Search by name or skill..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--saffron)] transition-all" 
           />
        </div>
      </div>

      {/* AI STRATEGIC PANEL */}
      <div className="bg-[#0F172A] rounded-3xl p-8 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Brain size={120} /></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
               <div className="flex items-center gap-3 text-[var(--saffron)] mb-2">
                  <Sparkles size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest font-mukta !text-white">AI Talent Scout</h2>
               </div>
               <p className="text-slate-300 font-medium text-lg leading-relaxed italic">
                  {isAiLoading ? 'Analyzing volunteer pool and strategic capacity...' : aiScout?.strategy || 'Reviewing current workforce logistics...'}
               </p>
               
               <div className="flex flex-wrap gap-4 pt-4">
                  {aiScout?.matches?.slice(0, 2).map((m: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-[var(--saffron-light)] flex items-center justify-center text-[var(--saffron)] font-bold">{m.volunteerName[0]}</div>
                       <div>
                          <p className="text-[10px] font-bold text-[var(--saffron)] uppercase">Smart Match</p>
                          <p className="text-xs font-bold">{m.volunteerName} → {m.needTitle}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Brain size={14} /> Critical Skill Gaps
               </h3>
               <div className="space-y-2">
                  {(aiScout?.gaps || ["Analyzing needs..."]).map((gap: string) => (
                    <div key={gap} className="flex items-center gap-2 text-sm text-slate-300">
                       <div className="w-1 h-1 rounded-full bg-red-500" /> {gap}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVolunteers.map(v => (
          <div key={v.id} className="card p-6 flex flex-col group hover:border-[var(--saffron)] transition-all bg-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--saffron)] opacity-5 translate-x-10 -translate-y-10 rounded-full" />
             
             <div className="flex justify-between items-start mb-4">
                <div className="relative">
                    <img src={`https://i.pravatar.cc/150?img=${v.id}`} className="w-16 h-16 rounded-2xl shadow-md group-hover:scale-105 transition-transform object-cover" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${v.status === 'Available' ? 'bg-green-500' : 'bg-orange-500'}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${v.status === 'Available' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {v.status}
                </span>
             </div>
             
             <h3 className="text-xl font-bold font-mukta text-[var(--ink)] mb-1 group-hover:text-[var(--saffron)] transition-colors">{v.name}</h3>
             <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-bold mb-4">
                <Star size={12} fill="currentColor" /> {v.rating.toFixed(1)} <span className="text-gray-600 font-normal ml-1">({v.hours} hrs logged)</span>
             </div>

             <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
                {v.skills.slice(0, 2).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold uppercase text-gray-500 tracking-wider ">{s}</span>
                ))}
                {v.skills.length > 2 && <span className="text-[10px] font-bold text-gray-600">+{v.skills.length - 2} more</span>}
             </div>

             <div className="grid grid-cols-2 gap-3 pt-6 border-t border-[var(--border)]">
                <button 
                  onClick={() => setSelectedVolunteer(v)} 
                  className="py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                   Profile View
                </button>
                <button 
                  onClick={() => toast.success(`Assigning ${v.name} to higher-priority task...`)} 
                  className="py-2.5 rounded-xl bg-[var(--saffron)] text-white text-xs font-bold shadow-lg shadow-[var(--saffron-glow)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <UserCheck size={14} /> Quick Assign
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* COMPREHENSIVE VOLUNTEER PROFILE MODAL */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[var(--ink)]/60 backdrop-blur-sm" onClick={() => setSelectedVolunteer(null)} />
           <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in slide-in-from-bottom-8 duration-500">
              
              {/* Left Panel: Identity */}
              <div className="md:w-1/3 bg-[var(--surface-2)] p-8 flex flex-col items-center text-center border-r border-[var(--border)]">
                 <div className="relative mb-6">
                    <img src={`https://i.pravatar.cc/150?img=${selectedVolunteer.id}`} className="w-32 h-32 rounded-[40px] shadow-2xl border-4 border-white" />
                    <div className="absolute -bottom-2 right-2 bg-white p-2 rounded-2xl shadow-lg text-[var(--saffron)]"><Shield size={20} /></div>
                 </div>
                 <h2 className="text-2xl font-bold font-mukta leading-tight mb-2">{selectedVolunteer.name}</h2>
                 <p className="text-[10px] font-bold text-[var(--saffron)] uppercase tracking-[3px] mb-6">Verified Member</p>
                 
                 <div className="w-full space-y-3">
                    <div className="bg-white p-3 rounded-2xl border border-[var(--border)]">
                        <p className="text-xl font-bold">{selectedVolunteer.hours}h</p>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Experience</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[var(--border)]">
                        <p className="text-xl font-bold">{selectedVolunteer.rating.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Avg Rating</p>
                    </div>
                 </div>
              </div>

              {/* Right Panel: Content */}
              <div className="md:w-2/3 p-8 md:p-10 flex flex-col">
                 <button onClick={() => setSelectedVolunteer(null)} className="ml-auto w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-[var(--ink)] transition-colors mb-2">&times;</button>
                 
                 <div className="space-y-6">
                    <section>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">About Field Engineer</h4>
                        <p className="text-sm text-[var(--ink-muted)] leading-relaxed italic">"{selectedVolunteer.bio}"</p>
                    </section>

                    <section className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> Connectivity</h4>
                            <p className="text-sm font-bold">{selectedVolunteer.phone}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><Mail size={10} /> Email</h4>
                            <p className="text-sm font-bold truncate">{selectedVolunteer.email}</p>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Verified Skillset</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedVolunteer.skills.map((s: string) => (
                                <span key={s} className="px-3 py-1 bg-[var(--surface-3)] text-[var(--ink)] rounded-lg text-xs font-bold border border-[var(--border)]">{s}</span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Achievements</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedVolunteer.badges.map((b: string) => (
                                <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-xl text-[10px] font-bold border border-yellow-100">
                                    <Award size={12} /> {b}
                                </span>
                            ))}
                        </div>
                    </section>
                 </div>

                 <div className="mt-auto pt-8 flex gap-3">
                    <button onClick={() => { setSelectedVolunteer(null); toast.success('Pinging volunteer for immediate task...'); }} className="flex-1 py-4 bg-[var(--saffron)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--saffron-glow)] hover:opacity-90">Send Assignment</button>
                    <button onClick={() => { setActiveChat(selectedVolunteer); setSelectedVolunteer(null); }} className="w-14 h-14 bg-[var(--ink)] text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-90">
                       <MessageSquare size={20} />
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    <Clock size={12} /> Last Active: {selectedVolunteer.lastActive}
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
