
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            Disaster Mode Configuration
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="mt-6 max-w-4xl space-y-6">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h2 className="text-red-700 font-bold text-2xl flex items-center gap-3">⚠️ WARNING: DISASTER MODE PROTOCOLS</h2>
          <p className="text-red-600 mt-2">Activating disaster mode overrides standard approval chains, pushes priority SMS alerts to all volunteers in a 100km radius, and bypasses standard API rate limits. Use strictly during state-issued emergencies.</p>
        </div>
        <div className="card space-y-4">
           <h3 className="font-bold border-b pb-2">Pre-configured Emergency SOPs</h3>
           <div className="flex items-center justify-between p-4 border rounded-lg">
             <div><h4 className="font-bold">Cyclone Response Preset</h4><p className="text-sm text-gray-500">Prioritizes shelters, barricades, and medical evacuations.</p></div>
             <button className="px-4 py-2 bg-slate-800 text-white rounded font-bold" onClick={() => alert('Armed Cyclone Preset!')}>Arm Preset</button>
           </div>
           <div className="flex items-center justify-between p-4 border rounded-lg">
             <div><h4 className="font-bold">Earthquake Response Preset</h4><p className="text-sm text-gray-500">Prioritizes heavy machinery, blood donations, and rescue teams.</p></div>
             <button className="px-4 py-2 bg-slate-800 text-white rounded font-bold" onClick={() => alert('Armed Earthquake Preset!')}>Arm Preset</button>
           </div>
        </div>
      </div>
      
    </div>
  );
}
