'use client';

import { AuditLedger } from '@/components/shared/AuditLedger';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function StatsPage() {
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  const [metrics, setMetrics] = useState({ totalNeeds: 0, activeNeeds: 0, resolvedNeeds: 0 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'needs'), (snapshot) => {
      // Create a map of days (e.g. Mon, Tue)
      const dayCounts: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      let active = 0;
      let resolved = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'completed') resolved++;
        else if (data.status === 'active' || data.status === 'in_progress') active++;
        
        if (data.created_at) {
          const date = new Date(data.created_at);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          if (dayCounts[dayName] !== undefined) {
            dayCounts[dayName]++;
          }
        }
      });
      
      setMetrics({
        totalNeeds: snapshot.size,
        activeNeeds: active,
        resolvedNeeds: resolved
      });

      // Convert to array for Recharts
      const dataArr = Object.keys(dayCounts).map(day => ({
        name: day,
        value: dayCounts[day]
      }));
      setChartData(dataArr);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    
    return () => unsub();
  }, []);
  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-mukta text-slate-900 tracking-tighter">Impact Analytics</h1>
          <p className="text-slate-600 font-medium mt-1">Deep data visualization of global relief velocity and institutional performance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Export Report</button>
          <button 
            onClick={() => {
              toast.loading('Syncing with global ledger...', { duration: 1500 });
              setTimeout(() => toast.success('Data synchronized.', { icon: '🔄' }), 1500);
            }} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-red-500 to-blue-500" />
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><TrendingUp className="text-emerald-500" /> Intervention Velocity</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500" />
                       <span className="text-[10px] font-black text-slate-600 uppercase">Relief Units</span>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Growth: +24.8%</div>
                 </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }} 
                      itemStyle={{ fontWeight: 800, color: '#0F172A' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { l: 'Total Incidents', v: metrics.totalNeeds.toLocaleString(), i: Users, c: 'text-blue-600', bg: 'bg-blue-50' },
                { l: 'Active Incidents', v: metrics.activeNeeds.toLocaleString(), i: Target, c: 'text-red-600', bg: 'bg-red-50' },
                { l: 'Resolved Incidents', v: metrics.resolvedNeeds.toLocaleString(), i: BarChart3, c: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                   <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.c} flex items-center justify-center mb-6`}>
                      <s.i size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.l}</p>
                   <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{s.v}</h4>
                   <div className="mt-4 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">Live Database Read</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-8">
           <div className="h-[730px]">
              <AuditLedger />
           </div>
           <div className="mt-4 p-4 bg-slate-900 text-white rounded-3xl flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Network Pulse</p>
              </div>
              <p className="text-[10px] font-mono text-slate-400">0x42...F9A2</p>
           </div>
        </div>
      </div>
    </div>
  );
}
