'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { scopeToCity } from '@/lib/data/needs';
import { useNeeds } from '@/lib/data/use-needs';
import {
  AlertTriangle, Clock, Columns3, CheckCircle, PlusCircle, Activity, Users, Sparkles,
  Map as MapIcon, Zap, ArrowRight, MapPin, Building2
} from 'lucide-react';

export default function NgoDashboard() {
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    activeNeeds: 0,
    pendingVerification: 0,
    volunteersDeployed: 0,
    needsResolvedThisWeek: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<{ summary: string; priorities: any[] } | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);

  // Read through the server, and show only what is actually there.
  const { needs: boardNeeds, isLoading: boardLoading } = useNeeds({ assignment: 'ngo' });

  useEffect(() => {
    setStats({
      activeNeeds: boardNeeds.filter((n) => n.status === 'open' || n.status === 'reported' || n.status === 'verified').length,
      pendingVerification: boardNeeds.filter((n) => n.status === 'open' || n.status === 'reported').length,
      volunteersDeployed: boardNeeds.filter((n) => n.status === 'in_progress' || n.status === 'assigned').length,
      needsResolvedThisWeek: boardNeeds.filter((n) => n.status === 'completed' || n.status === 'closed').length,
    });

    // An NGO with nothing open sees nothing open, which is the truth and is
    // also actionable. This used to fall back to three invented incidents.
    setRecentIncidents(
      [...boardNeeds]
        .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))
        .slice(0, 6)
    );
    setIsLoading(boardLoading);
  }, [boardNeeds, boardLoading]);

  useEffect(() => {
    if (boardNeeds.length === 0) return;
    let cancelled = false;

    fetch('/api/ai/ngo-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ needs: boardNeeds.slice(0, 6) }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.summary) setAiInsights(data);
      })
      .catch((err) => console.error('Gemma insights unavailable:', err));

    return () => {
      cancelled = true;
    };
  }, [boardNeeds]);

  if (isLoading) return <LoadingSkeleton type="page" />;

  return (
    <div className="space-y-8 fade-in">
      {/* ... AI Insights Section (already correct) ... */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-[var(--ink)] to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top duration-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={40} /></div>
          <div className="flex items-center gap-2 text-[var(--saffron)] font-bold text-xs uppercase tracking-widest mb-3">
             <Sparkles size={14} /> <span className="!text-white">AI Strategic Summary</span>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-4">{aiInsights.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiInsights.priorities?.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold text-[var(--saffron)] mb-1 line-clamp-1">{p.title}</p>
                <p className="text-[10px] text-gray-300 line-clamp-2">{p.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Command Center Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-mukta mb-1 text-[var(--ink)]">NGO Command Center</h1>
          <p className="text-[var(--ink-muted)] font-medium">Disha Foundation • Rajkot</p>
        </div>
        <Link href="/ngo/needs/new" className="btn-primary shadow-lg shadow-[var(--saffron-glow)] hidden sm:flex">
          <PlusCircle size={18} />
          Report New Need
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* ... Stats Cards (keep existing) ... */}
         <div className="card bg-white hover:border-[var(--saffron)] transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
            <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded">Action</span>
          </div>
          <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{stats?.activeNeeds}</p>
          <p className="text-sm text-[var(--ink-muted)] font-medium">Active Needs</p>
        </div>
        
        <div className="card bg-white hover:border-orange-500 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{stats?.pendingVerification}</p>
          <p className="text-sm text-[var(--ink-muted)] font-medium">Pending Verify</p>
        </div>
        
        <div className="card bg-white hover:border-blue-500 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded">Live</span>
          </div>
          <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{stats?.volunteersDeployed}</p>
          <p className="text-sm text-[var(--ink-muted)] font-medium">Field Engineers</p>
        </div>

        <div className="card bg-white hover:border-green-500 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{stats?.needsResolvedThisWeek}</p>
          <p className="text-sm text-[var(--ink-muted)] font-medium">Resolved</p>
        </div>
      </div>

      {/* NEW: Heatmap and Operations Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="card p-0 bg-white relative overflow-hidden group shadow-xl border-[var(--border)] rounded-[2.5rem]">
               <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm relative z-20">
                  <div>
                    <h3 className="font-black font-mukta text-2xl uppercase tracking-tight flex items-center gap-2 text-[var(--ink)]">
                      <MapIcon size={24} className="text-blue-600" /> Strategic Heatmap
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Need Clusters</p>
                  </div>
               </div>

               <div className="h-[350px] bg-[#F8FAFC] relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                     <path d="M50,150 C100,50 300,30 450,80 C600,120 750,80 750,250 C750,400 600,450 400,420 C200,380 50,450 50,300 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                  </svg>
                  
                  <div className="absolute inset-0 z-10">
                     {recentIncidents.map((incident, idx) => {
                        const x = (incident.id.charCodeAt(0) * 17) % 60 + 20;
                        const y = (incident.id.charCodeAt(1) * 9) % 50 + 25;
                        const isHighUrgency = incident.urgency_score >= 8;
                        
                        return (
                           <div key={incident.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                              <div className={`w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-2xl ${isHighUrgency ? 'bg-orange-500' : 'bg-blue-400'}`} />
                              <div className="relative group/spot">
                                 <div className={`w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${isHighUrgency ? 'bg-orange-600 animate-pulse' : 'bg-blue-500'}`} />
                                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/spot:opacity-100 transition-all bg-white p-3 rounded-xl shadow-2xl border border-gray-100 w-48 z-50 pointer-events-none">
                                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Incident Report</p>
                                    <p className="text-xs font-bold text-[var(--ink)] line-clamp-1">{incident.title}</p>
                                    <p className="text-[10px] text-gray-500 line-clamp-2">{incident.description}</p>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="font-bold font-mukta text-xl flex items-center gap-2">
               <Activity size={20} className="text-blue-600" /> Operations Feed
            </h3>
            <div className="space-y-4">
               {recentIncidents.map((f) => (
                  <div key={f.id} className="card p-5 bg-white border-[var(--border)] hover:border-[var(--saffron)] transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          f.urgency_score >= 8 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                           Priority {f.urgency_score}
                        </span>
                        <Clock size={12} className="text-gray-300" />
                     </div>
                     <p className="text-sm font-bold text-[var(--ink)] mb-1 group-hover:text-[var(--saffron)] transition-colors">{f.title}</p>
                     <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{f.description}</p>
                     
                     {f.assigned_volunteer_name && (
                        <div className="flex items-center gap-2 mb-1 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                           <div className="w-5 h-5 rounded-md bg-[var(--ink)] flex items-center justify-center text-white">
                              <Users size={10} />
                           </div>
                           <p className="text-[9px] font-bold text-slate-700">Matched to: <span className="text-[var(--saffron-dark)]">{f.assigned_volunteer_name}</span></p>
                        </div>
                     )}

                     <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>{f.assigned_volunteer_name ? 'VIEW ASSIGNMENT' : 'ASSIGN VOLUNTEER'}</span>
                        <ArrowRight size={12} />
                     </div>
                  </div>
               ))}
               <button className="w-full py-4 bg-gray-50 text-[10px] font-black text-gray-400 rounded-2xl uppercase tracking-widest border border-dashed border-gray-200 hover:bg-gray-100 transition-colors">
                  Load Full Operation Logs
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* ... Existing Task/Intake Cards (keep them) ... */}
         <div className="card border-[var(--border)] relative overflow-hidden group hover:border-[var(--saffron)] transition-colors">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--saffron)] opacity-5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold font-mukta mb-2"><Columns3 className="inline mr-2 text-[var(--saffron)]" /> Task Board</h2>
          <p className="text-[var(--ink-muted)] mb-6">Manage volunteer assignments and track resolution progress.</p>
          <Link href="/ngo/tasks" className="btn-primary w-full justify-center">Open Task Board</Link>
        </div>

        <div className="card border-[var(--border)] relative overflow-hidden group hover:border-teal-500 transition-colors">
          <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500 opacity-5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold font-mukta mb-2"><Activity className="inline mr-2 text-teal-600" /> Data Intake API</h2>
          <p className="text-[var(--ink-muted)] mb-6">Sync CRM systems or upload bulk CSVs of community needs.</p>
          <Link href="/ngo/data-intake" className="btn-ghost border border-[var(--border)] w-full justify-center hover:border-teal-500 hover:text-teal-700">Manage Intake</Link>
        </div>
      </div>
    </div>
  );
}
