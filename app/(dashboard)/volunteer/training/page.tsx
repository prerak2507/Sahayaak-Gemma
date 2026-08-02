
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            Training Modules
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[
          { title: 'Disaster Response 101', dur: '45 mins', exp: 'Novice', color: 'blue' },
          { title: 'First Aid Essentials', dur: '2 hours', exp: 'All levels', color: 'red' },
          { title: 'Crowd Management', dur: '1.5 hours', exp: 'Advanced', color: 'orange' }
        ].map((c, i) => (
          <div key={i} className="card hover:shadow-lg transition-transform group cursor-pointer">
            <div className={`w-full h-32 rounded-xl bg-${c.color}-100 flex items-center justify-center mb-4`}>
              <span className={`text-4xl text-${c.color}-500`}>▶️</span>
            </div>
            <h3 className="font-bold text-lg">{c.title}</h3>
            <div className="flex gap-2 text-sm text-[var(--ink-muted)] mt-2">
              <span>⏱ {c.dur}</span> • <span>🎓 {c.exp}</span>
            </div>
            <button className="w-full mt-4 py-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-lg font-bold group-hover:bg-[var(--saffron)] group-hover:text-white transition-colors" onClick={() => alert('Launching Course...')}>Start Module</button>
          </div>
        ))}
      </div>
      
    </div>
  );
}
