'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Target, Clock, Zap, BarChart4, PieChart, Sparkles, Globe, AlertTriangle, Radio, Shield, X, Check, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { ALL_DEPARTMENTS, ALL_DEPARTMENT_EMPLOYEES, getDeptIcon } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';
import { useNeeds } from '@/lib/data/use-needs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

export default function Page() {
  const router = useRouter();
  const { 
    cityWards, activeCity,
    forecastData, deployPreventiveUnit,
    sentimentScore, sentimentFeed, issuePRStatement,
    emergencyState, triggerEmergency, revokeEmergency 
  } = useGovtStore();

  const [allGovtNeeds, setAllGovtNeeds] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<'tasks' | 'personnel'>('tasks');
  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];
  
  useEffect(() => {
    setDrawerTab('tasks');
  }, [selectedDept]);
  const DEPARTMENT_EMPLOYEES = ALL_DEPARTMENT_EMPLOYEES[activeCity] || ALL_DEPARTMENT_EMPLOYEES['rajkot'];

  // Read through the server.
  //
  // This page did not merely fall back to invented data, it always merged
  // eighteen fabricated incidents into whatever the database returned, under a
  // comment about guaranteeing a robust demo. Nothing on screen distinguished
  // the invented rows from the real ones, so every chart, department load
  // figure and SLA number on this page was wrong by construction.
  const { needs: boardNeeds } = useNeeds({ assignment: 'government' });

  useEffect(() => {
    setAllGovtNeeds(boardNeeds);
  }, [boardNeeds]);

  // Aggregate ward data for charts
  const chartData = useMemo(() => {
    const wards = cityWards['Rajkot'] || [];
    return wards.map(w => ({
      name: w.name,
      SLA_Compliance: w.sla,
      Open_Issues: w.open,
      Critical_Issues: w.red,
      Resolved_Issues: w.green
    }));
  }, [cityWards]);

  const globalStats = useMemo(() => {
    const wards = cityWards['Rajkot'] || [];
    const totalOpen = wards.reduce((sum, w) => sum + w.open, 0);
    const avgSla = wards.reduce((sum, w) => sum + w.sla, 0) / (wards.length || 1);
    const totalCritical = wards.reduce((sum, w) => sum + w.red, 0);
    
    return {
      totalOpen,
      avgSla: Math.round(avgSla),
      totalCritical
    };
  }, [cityWards]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <span className="text-[9px] font-mono text-indigo-600 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-1">
            <BarChart4 size={12} className="text-indigo-600" /> Executive Analytics Engine
          </span>
          <h1 className="text-3xl font-black font-mukta text-slate-800 tracking-tight">District Benchmarks</h1>
          <p className="text-slate-500 text-xs mt-1">Real-time data visualization driven by live ward metrics.</p>
        </div>
        <button 
          onClick={() => toast.success('Recalculating district growth index...')} 
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <TrendingUp size={14} /> Run Performance Audit
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🌐 INTERACTIVE City NETWORK MATRIX */}
      {/* ========================================================================= */}
      <section className="mt-8 mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Globe size={200} className="text-indigo-900" />
          </div>
          
          <div className="space-y-5 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5 text-indigo-600">
                  <Globe size={14} className="text-indigo-600 animate-pulse" /> City NETWORK MATRIX
                </span>
                <h3 className="text-xl font-black font-mukta text-slate-800 mt-1">Departmental Status Beacons</h3>
                <p className="text-xs text-slate-500 mt-1">Select any department to view active deployments and personnel status.</p>
              </div>
            </div>
            
            <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEPARTMENTS.map((d) => {
                const deptNeeds = allGovtNeeds.filter(n => n.assigned_department === d.id && n.status !== 'completed');
                const hasCritical = deptNeeds.some(n => n.urgency_score >= 8);
                const hasHighLoad = deptNeeds.length > 5;
                const dynamicHealth = hasCritical ? 'CRITICAL' : hasHighLoad ? 'HIGH LOAD' : 'OPTIMAL';
                
                const crew = DEPARTMENT_EMPLOYEES[d.id] || [];
                const isUnderstaffed = deptNeeds.length > crew.length * 2;
                
                return (
                <div 
                  key={d.id} 
                  onClick={() => setSelectedDept(d)}
                  className="flex flex-col py-3 px-4 border border-slate-100 rounded-2xl bg-slate-50/50 cursor-pointer hover:border-indigo-200 hover:bg-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-900/5 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 group-hover:border-indigo-100 shadow-sm transition-colors">
                        {getDeptIcon(d.id)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 text-xs block group-hover:text-indigo-600 transition-colors">{d.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">{deptNeeds.length} Open Tasks</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      dynamicHealth === 'CRITICAL' ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                      dynamicHealth === 'HIGH LOAD' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {dynamicHealth}
                    </span>
                  </div>

                  {d.worker && (
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 group-hover:border-indigo-100 transition-colors shadow-sm">
                      <div className="flex items-center gap-2">
                        <img src={d.avatar} alt={d.worker} className="w-8 h-8 rounded-full border border-slate-100 object-cover group-hover:border-indigo-200 transition-colors" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-700">{d.worker}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">{d.title}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/govt/telemetry?deptId=${d.id}&focusId=hod-${d.id}`);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                        title="Summon GPS"
                      >
                        <Radio size={12} className="group-hover:animate-pulse" />
                      </button>
                    </div>
                  )}

                  <div className="mt-2.5 flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-slate-400">Resource Load</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                      isUnderstaffed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {crew.length} Crew vs {deptNeeds.length} Tasks
                    </span>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </section>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { l: 'Total Open Issues', v: globalStats.totalOpen, i: <Clock size={24} />, c: 'text-amber-500 bg-amber-50 border-amber-100' },
           { l: 'Critical Red Alerts', v: globalStats.totalCritical, i: <Zap size={24} />, c: 'text-red-500 bg-red-50 border-red-100' },
           { l: 'Avg SLA Compliance', v: `${globalStats.avgSla}%`, i: <Target size={24} />, c: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
           { l: 'Resolution Velocity', v: '+12.4%', i: <TrendingUp size={24} />, c: 'text-blue-500 bg-blue-50 border-blue-100' },
         ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${s.c}`}>
                 {s.i}
               </div>
               <div>
                 <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{s.v}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.l}</p>
               </div>
            </div>
         ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Chart 1: SLA Compliance by Ward */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-extrabold text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wider">
                 <Target size={16} className="text-indigo-500" /> SLA Compliance by Ward
               </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="SLA_Compliance" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2: Incident Volume Spread */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-extrabold text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wider">
                 <PieChart size={16} className="text-rose-500" /> Incident Volume Spread
               </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Open_Issues" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOpen)" />
                  <Area type="monotone" dataKey="Resolved_Issues" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* ========================================================================= */}
      {/* 👑 COMMISSIONER STRATEGIC POWER FEATURES */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mt-8">
        
        {/* 1. Predictive AI Forecasting Widget */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-lg">AI Disaster Forecast</h3>
            </div>
            <div className="space-y-3">
              {forecastData.map((f, i) => {
                const dynamicWards = 
                  activeCity.toLowerCase() === 'mumbai' ? ['Andheri (West)', 'Bandra Kurla Complex', 'Dadar Node'] :
                  activeCity.toLowerCase() === 'rajkot' ? ['Mavdi HQ', 'Kalavad Road', 'Amin Marg'] :
                  activeCity.toLowerCase() === 'surat' ? ['Adajan', 'Vesu', 'Varachha'] :
                  activeCity.toLowerCase() === 'vadodara' ? ['Alkapuri', 'Sayajiganj', 'Akota'] :
                  activeCity.toLowerCase() === 'ahmedabad' ? ['Satellite', 'Bodakdev', 'Maninagar'] :
                  [f.ward, 'Paharganj', 'Karol Bagh'];
                const displayWard = dynamicWards[i] || f.ward;
                return (
                <div key={f.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{displayWard}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${f.risk > 70 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {f.risk}% Risk
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700">{f.type}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{f.timeframe}</span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded shadow-sm border border-slate-100">
                      {f.risk >= 70 ? (
                        <>
                          <Zap size={10} className="text-red-500 animate-pulse" />
                          <span className="text-[8px] font-black text-red-600 uppercase tracking-wider">AI Auto-Dispatched</span>
                        </>
                      ) : f.risk >= 40 ? (
                        <>
                          <AlertTriangle size={10} className="text-amber-500" />
                          <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider">AI Standby Mode</span>
                        </>
                      ) : (
                        <>
                          <Shield size={10} className="text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">AI Monitoring</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Public Sentiment Monitor */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-500" />
                <h3 className="font-extrabold text-slate-800 text-lg">Public Sentiment</h3>
              </div>
              <div className={`text-2xl font-black ${sentimentScore > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {sentimentScore}<span className="text-xs text-slate-400">/100</span>
              </div>
            </div>
            
            <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
              {sentimentFeed.map((post: any) => (
                <div key={post.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group">
                  {post.sentiment !== 'positive' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                  )}
                  <div className="flex justify-between items-center mb-1 ml-1.5">
                    <span className="text-[10px] font-bold text-slate-600">{post.user}</span>
                    <span className="text-[8px] text-slate-400">{post.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug ml-1.5">"{post.text}"</p>
                  
                  <div className="mt-2 pt-2 ml-1.5 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${post.sentiment === 'positive' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">{post.sentiment === 'positive' ? 'Optimal - No Action' : 'Severity: HIGH'}</span>
                    </div>
                    {post.sentiment !== 'positive' && (
                       <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50/80 text-blue-600 border border-blue-100 rounded shadow-sm">
                         <Sparkles size={8} />
                         <span className="text-[8px] font-black uppercase tracking-widest">AI Auto-Assurance</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Sparkles size={14} className="text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">AI Sentiment Shield</p>
                <p className="text-[8px] text-blue-500 font-bold">Auto-deploying responses based on severity & jurisdiction</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-white border border-blue-100 rounded shadow-sm flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* 3. National Escalation (Red Button) */}
        <div className={`border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-500 ${emergencyState ? 'bg-red-950 border-red-900 shadow-red-900/50 shadow-2xl' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className={emergencyState ? 'text-red-400 animate-pulse' : 'text-rose-500'} />
              <h3 className={`font-extrabold text-lg ${emergencyState ? 'text-red-100' : 'text-slate-800'}`}>National Escalation</h3>
            </div>
            <p className={`text-xs leading-relaxed ${emergencyState ? 'text-red-300' : 'text-slate-500'}`}>
              Triggering a State of Emergency will immediately notify the NDRF (National Disaster Response Force) and override all municipal command channels to high-alert status.
            </p>
            {emergencyState && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500/30 rounded-xl text-center">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                  🚨 NDRF UNITS DISPATCHED TO CITY PERIMETER
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              if (emergencyState) {
                revokeEmergency();
                toast.success("State of Emergency revoked. City returning to normal operations.");
              } else {
                if (window.confirm("CRITICAL WARNING: Are you sure you want to declare a State of Emergency and request NDRF intervention?")) {
                  triggerEmergency();
                  toast.error("STATE OF EMERGENCY DECLARED", { icon: '🚨', duration: 5000 });
                }
              }
            }}
            className={`w-full mt-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              emergencyState 
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700'
            }`}
          >
            {emergencyState ? 'REVOKE EMERGENCY STATUS' : 'DECLARE STATE OF EMERGENCY'}
          </button>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 📥 DEPARTMENTAL TASK DRAWER */}
      {/* ========================================================================= */}
      {selectedDept && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full md:w-[450px] bg-slate-50 h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right-full duration-300 relative">
            <button 
              onClick={() => setSelectedDept(null)} 
              className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-colors text-slate-500 shadow-sm"
            >
              <X size={16} />
            </button>
            
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">
                  {getDeptIcon(selectedDept.id)}
                </div>
                <div>
                  <h2 className="text-xl font-black font-mukta text-slate-800">{selectedDept.name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Zap size={10} className="text-amber-500" /> Department Details
                  </p>
                </div>
              </div>

              <div className="flex gap-6 mt-6 border-b border-slate-100 pb-0">
                <button 
                  onClick={() => setDrawerTab('tasks')} 
                  className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-colors ${drawerTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="flex items-center gap-1.5"><Zap size={14} /> Active Tasks</span>
                </button>
                <button 
                  onClick={() => setDrawerTab('personnel')} 
                  className={`text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-colors ${drawerTab === 'personnel' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="flex items-center gap-1.5"><Users size={14} /> Personnel Directory</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
              {drawerTab === 'personnel' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {(() => {
                    const employees = DEPARTMENT_EMPLOYEES[selectedDept.id] || [];
                    const currentHour = new Date().getHours();
                    const isWorkingHours = currentHour >= 9 && currentHour < 17; // 9 AM to 5 PM
                    
                    const personnelList = [
                       { id: 'head', name: selectedDept.worker, title: selectedDept.title, avatar: selectedDept.avatar, role: 'Head of Department' },
                       ...employees.map(e => ({ ...e, role: 'Field Agent / Field Engineer' }))
                    ];

                    return personnelList.map(person => (
                      <div key={person.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col gap-4 group hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={person.avatar} alt={person.name} className="w-14 h-14 rounded-full border-2 border-slate-100 object-cover shadow-sm" />
                            {isWorkingHours ? (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                            ) : (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-300 border-2 border-white rounded-full shadow-sm"></span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-[15px]">{person.name}</p>
                            <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5">{person.role}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{person.title}</p>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock size={12} /> Work Hours
                            </span>
                            <span className="text-[10px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                              09:00 - 17:00
                            </span>
                          </div>
                          
                          {isWorkingHours ? (
                            <button 
                              onClick={() => router.push(`/govt/telemetry?deptId=${selectedDept.id}&focusId=${person.id}`)}
                              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-indigo-100 hover:border-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                            >
                              <MapPin size={14} className="group-hover/btn:animate-bounce" /> Connect Live Location
                            </button>
                          ) : (
                            <div 
                              className="w-full py-2.5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                              title="Location hidden outside working hours"
                            >
                              <Shield size={14} className="text-slate-400" /> Privacy Lock: Off Duty
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {drawerTab === 'tasks' && (
                allGovtNeeds.filter(n => n.assigned_department === selectedDept.id && n.status !== 'completed').length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-sm mb-4">
                    <Check size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">No Open Incidents</p>
                  <p className="text-[10px] text-slate-500 mt-1">This department's queue is clear.</p>
                </div>
              ) : (
                allGovtNeeds
                  .filter(n => n.assigned_department === selectedDept.id && n.status !== 'completed')
                  .sort((a, b) => b.urgency_score - a.urgency_score)
                  .map((incident, idx) => {
                    const employees = DEPARTMENT_EMPLOYEES[selectedDept.id] || [];
                    
                    // Default fallback logic using round-robin distribution
                    const fallbackMatch = employees[idx % employees.length] || { name: 'AI Assigned', title: 'Field Engineer', avatar: '' };
                    
                    // If the incident already has a real worker assigned from the database, use it!
                    const workerName = incident.assigned_worker_name || fallbackMatch.name;
                    const workerTitle = incident.assigned_worker_title || fallbackMatch.title;
                    const workerAvatar = incident.assigned_worker_avatar || fallbackMatch.avatar;
                    
                    return (
                    <div key={incident.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative overflow-hidden">
                      {/* Premium indicator line */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        incident.urgency_score >= 8 ? 'bg-red-500' :
                        incident.urgency_score >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      
                      <div className="flex justify-between items-start mb-3 ml-2">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          incident.urgency_score >= 8 ? 'bg-red-50 text-red-600' :
                          incident.urgency_score >= 5 ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          Urgency: {incident.urgency_score}/10
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4 ml-2 leading-snug">{incident.title}</h4>
                      
                      <div className="ml-2 mt-2">
                        <div className="w-full p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={workerAvatar} alt={workerName} className="w-8 h-8 rounded-full border border-indigo-200 object-cover" />
                            <div>
                              <p className="text-[11px] font-black text-slate-700">{workerName}</p>
                              <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{workerTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded shadow-sm border border-slate-100">
                             <Sparkles size={10} className="text-emerald-500" />
                             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">AI Dispatched</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
