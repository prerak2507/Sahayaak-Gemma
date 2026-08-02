
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            Wellness Tracking
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h3 className="font-bold mb-4">Weekly Activity</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
              <div key={i} className="w-full bg-[var(--saffron-light)] rounded-t-sm" style={{ height: `${h}%` }}>
                <div className="bg-[var(--saffron)] w-full rounded-t-sm transition-all" style={{ height: `${h * 0.8}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
          </div>
        </div>
        <div className="card bg-[var(--teal-light)] border-[var(--teal)]">
          <h3 className="font-bold text-[var(--teal-dark)] text-xl mb-2">Check-in with a Counselor</h3>
          <p className="text-[var(--teal-dark)] opacity-80 mb-6">You've logged over 40 hours this week. Taking care of your mental health is a priority.</p>
          <button className="bg-[var(--teal)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90">Schedule Free Session</button>
        </div>
      </div>
      
    </div>
  );
}
