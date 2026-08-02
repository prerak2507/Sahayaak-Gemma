'use client';
import React from 'react';
import { Package, ShieldCheck, AlertCircle, TrendingUp, Ship, HardDrive, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Page() {
  const supplies = [
    { n: 'Emergency Grain Stock', q: '124 Tons', s: 'Critical', c: 'red', p: 12 },
    { n: 'Medical Aid Kits', q: '8,210 Units', s: 'In Stock', c: 'green', p: 88 },
    { n: 'Oxygen Canisters', q: '450 Units', s: 'Low', c: 'orange', p: 32 },
    { n: 'Flood Tents', q: '1,200 Sets', s: 'In Stock', c: 'green', p: 75 },
    { n: 'Potable Water Packs', q: '42,000 Pcs', s: 'Optimal', c: 'blue', p: 95 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen">
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6">
        <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Placeholder screen</p>
        <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">Stock levels are not wired to any source in this build. The figures below are placeholders showing the intended layout, not real inventory.</p>
      </div>
      <div className="flex justify-between items-end">
        <div><h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Supply Chain Inventory</h1><p className="text-[var(--ink-muted)]">Official monitoring of district-wide emergency resources.</p></div>
        <button onClick={() => toast.success('Requesting state-level grain allocation...')} className="btn-primary flex items-center gap-2"><TrendingUp size={18} /> Request Supplies</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="card p-8 space-y-6">
            <h3 className="font-bold font-mukta text-xl">Stock Telemetry</h3>
            <div className="space-y-6">
               {supplies.map((s, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${s.c === 'red' ? 'bg-red-500' : s.c === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`} />
                           <p className="text-sm font-bold">{s.n}</p>
                        </div>
                        <p className="text-xs font-bold text-gray-600">{s.q}</p>
                     </div>
                     <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.c === 'red' ? 'bg-red-500' : s.c === 'orange' ? 'bg-orange-500' : 'bg-blue-600'} transition-all duration-1000`} style={{ width: `${s.p}%` }} />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 gap-6">
            <div className="card p-6 bg-blue-900 text-white flex flex-col justify-center border-none shadow-2xl relative overflow-hidden">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500 opacity-20 -rotate-12 translate-x-10 translate-y-10" />
               <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14} /> Critical Pipeline</h4>
               <p className="text-2xl font-bold font-mukta mb-2">4 Missions Waiting</p>
               <p className="text-xs text-blue-200 opacity-70 mb-6">Insufficient grain stock detected for Delhi West wards. Expected state delivery: Wednesday.</p>
               <button className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors">Accelerate Logistics</button>
            </div>
            
            <div className="card p-6 border-dashed border-blue-200">
               <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-blue-700"><Ship size={16} /> Regional Ports</h4>
               <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest leading-relaxed">External supply intake channels: Kandla (Active), Mundra (Active), Navlakhi (Maintenance).</p>
            </div>
         </div>
      </div>
    </div>
  );
}
