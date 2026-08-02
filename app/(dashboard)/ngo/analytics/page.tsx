'use client';
import React, { useState } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Activity, Users, Clock, Flame, 
  Download, Filter, Calendar, Map, PieChart, BarChart3, TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Page() {
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">NGO Intelligence Center</h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Real-time performance telemetry and resource utilization metrics.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white border border-[var(--border)] rounded-xl p-1 flex gap-1">
              {['7D', '30D', '90D'].map(t => (
                <button 
                    key={t} 
                    onClick={() => setTimeframe(t === '7D' ? 'Last 7 Days' : t === '30D' ? 'Last 30 Days' : 'Last 90 Days')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe.includes(t) ? 'bg-[var(--saffron)] text-white shadow-md' : 'text-gray-600 hover:text-[var(--ink)]'}`}
                >
                    {t}
                </button>
              ))}
           </div>
           <button onClick={() => toast.success('Syncing with live district data...')} className="btn-primary flex items-center gap-2"><Activity size={18} /> Live Sync</button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fulfillment Rate', val: '94.2%', trend: '+4.2%', positive: true, icon: TrendingUp, desc: 'vs previous period' },
          { label: 'Active Field Engineers', val: '864', trend: '+12.5%', positive: true, icon: Users, desc: 'currently deployed' },
          { label: 'Mean Response', val: '8.5m', trend: '-1.2m', positive: true, icon: Clock, desc: 'time to first verification' },
          { label: 'Resource Surplus', val: 'Low', trend: 'CRITICAL', positive: false, icon: Flame, desc: 'medical kits in stock' },
        ].map((s, i) => (
          <div key={i} className="card p-6 border-transparent bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)] opacity-50 group-hover:w-full group-hover:opacity-5 transition-all" />
             <div className="flex justify-between items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[var(--saffron)]"><s.icon size={20} /></div>
                <div className={`flex items-center gap-1 text-xs font-bold ${s.positive ? 'text-green-500' : 'text-red-500'}`}>
                   {s.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {s.trend}
                </div>
             </div>
             <div className="mt-4 relative z-10">
                <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{s.val}</p>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">{s.label}</p>
                <p className="text-[10px] text-gray-300 font-medium mt-2">{s.desc}</p>
             </div>
          </div>
        ))}
      </div>

      {/* MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* VOLUNTEER DEPLOYMENT TREND (Line) */}
         <div className="lg:col-span-2 card p-8 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-xl font-bold font-mukta">Field Engineer Deployment Velocity</h3>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Daily Engagement Matrix • {timeframe}</p>
                </div>
                <button onClick={() => toast.success('Downloading high-res report...')} className="p-2 hover:bg-gray-50 rounded-lg border border-[var(--border)] text-gray-600"><Download size={18} /></button>
            </div>
            
            <div className="flex-1 w-full relative flex flex-col">
               {/* Simplified Legend */}
               <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><span className="w-3 h-3 rounded bg-[var(--saffron)]" /> PLANNED REQ</div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><span className="w-3 h-3 rounded bg-[var(--ink)]" /> ACTUAL HELPers</div>
               </div>

               <div className="flex-1 relative group">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                     {/* Horizontal grid lines */}
                     {[0, 10, 20, 30, 40].map(y => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.2" />
                     ))}

                     {/* The Area Path */}
                     <path 
                        d="M0,40 L0,32 C10,30 20,10 30,18 C40,25 50,5 65,15 C80,30 90,5 100,10 L100,40 Z" 
                        fill="rgba(255,107,53,0.12)" 
                     />
                     <path 
                        d="M0,32 C10,30 20,10 30,18 C40,25 50,5 65,15 C80,30 90,5 100,10" 
                        fill="none" 
                        stroke="var(--saffron)" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        vectorEffect="non-scaling-stroke"
                     />

                     {/* The Comparison Path */}
                     <path 
                        d="M0,35 C15,35 30,25 45,28 C60,32 80,18 100,20" 
                        fill="none" 
                        stroke="var(--ink)" 
                        strokeWidth="1.5" 
                        strokeDasharray="2,2" 
                        strokeLinecap="round" 
                        vectorEffect="non-scaling-stroke"
                        className="opacity-40"
                     />

                     {/* Hover Interaction Dots */}
                     {[30, 65, 100].map(x => (
                        <circle key={x} cx={x} cy={x === 30 ? 18 : x === 65 ? 15 : 10} r="1" fill="white" stroke="var(--saffron)" strokeWidth="0.5" />
                     ))}
                  </svg>
                  
                  {/* Tooltip Simulation */}
                  <div className="absolute top-[10%] left-[62%] bg-white border border-[var(--border)] shadow-2xl p-4 rounded-2xl animate-in zoom-in slide-in-from-bottom-2 duration-300 pointer-events-none">
                     <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Peak Capacity</p>
                     <p className="text-lg font-bold text-[var(--saffron)] font-mukta">84 Active/hr</p>
                     <div className="h-1 w-full bg-orange-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[var(--saffron)] w-[85%]" /></div>
                  </div>
               </div>

               <div className="flex justify-between text-[10px] font-bold text-gray-600 mt-6 uppercase tracking-widest">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                  <span>Current</span>
               </div>
            </div>
         </div>

         {/* SECTOR DISTRIBUTION (Bar) */}
         <div className="card p-8 flex flex-col">
             <h3 className="text-xl font-bold font-mukta mb-10 flex items-center gap-2"><BarChart3 size={20} className="text-[var(--saffron)]" /> Sector Intensity</h3>
             <div className="flex-1 space-y-8">
                {[
                  { n: 'Food & Hunger', p: 88, c: '#FF6B35' },
                  { n: 'Medical Aid', p: 72, c: '#E11D48' },
                  { n: 'Environment', p: 45, c: '#059669' },
                  { n: 'Digital Literacy', p: 32, c: '#3B82F6' },
                  { n: 'Safety Hubs', p: 58, c: '#D97706' },
                ].map((sector, i) => (
                  <div key={i} className="space-y-2 group cursor-default">
                     <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--saffron)] transition-colors">{sector.n}</p>
                        <p className="text-[10px] font-bold text-gray-600">{sector.p}% Utilization</p>
                     </div>
                     <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-[var(--border)] p-[1px]">
                        <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                            style={{ width: `${sector.p}%`, background: sector.c }} 
                        />
                     </div>
                  </div>
                ))}
             </div>
         </div>

      </div>

      {/* SECONDARY ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* STATUS DONUT (Mock) */}
         <div className="card p-8 flex flex-col md:flex-row items-center gap-10">
            <div className="relative w-48 h-48">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="var(--saffron)" strokeWidth="12" fill="none" strokeDasharray="251" strokeDashoffset="50" strokeLinecap="round" className="animate-in fade-in duration-1000" />
                  <circle cx="50" cy="50" r="40" stroke="var(--ink)" strokeWidth="12" fill="none" strokeDasharray="251" strokeDashoffset="210" strokeLinecap="round" className="animate-in fade-in duration-1000" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-[var(--ink)]">1,824</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Total Resolved</p>
               </div>
            </div>
            <div className="flex-1 space-y-4">
               <div>
                  <h3 className="font-bold text-lg font-mukta">Need Status Lifecycle</h3>
                  <p className="text-xs text-gray-600 mb-6">Distribution of reports across the pipeline.</p>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[var(--saffron)]" /> Verified / Active</span> <span>84%</span></div>
                  <div className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[var(--ink)]" /> In Pipeline</span> <span>12%</span></div>
                  <div className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-gray-100" /> Pending Review</span> <span>4%</span></div>
               </div>
            </div>
         </div>

         {/* RECENT DATA AUDIT (Table-like) */}
         <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-[var(--surface)]">
               <h3 className="font-bold font-mukta">District Audit Log</h3>
               <button onClick={() => toast.success('Opening audit vault...')} className="text-xs font-bold text-[var(--saffron)] hover:underline">Full Audit</button>
            </div>
            <div className="p-0">
               {[
                 { district: 'Delhi West', status: 'Optimal', load: '12%', color: 'text-green-500' },
                 { district: 'Delhi Central', status: 'High Load', load: '84%', color: 'text-orange-500' },
                 { district: 'Surat North', status: 'Stable', load: '45%', color: 'text-blue-500' },
                 { district: 'Ahmedabad South', status: 'Critical', load: '96%', color: 'text-red-500' },
               ].map((d, i) => (
                 <div key={i} className="px-6 py-4 flex items-center justify-between border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <div>
                       <p className="text-sm font-bold text-[var(--ink)]">{d.district}</p>
                       <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Telemetry Active</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-bold ${d.color}`}>{d.status}</p>
                       <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Load: {d.load}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
}
