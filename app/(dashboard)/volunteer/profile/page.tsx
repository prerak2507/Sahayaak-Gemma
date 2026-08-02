
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            My Profile
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="mt-6 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 space-y-6">
          <div className="card text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[var(--saffron)] text-white text-4xl flex items-center justify-center font-bold mb-4 shadow-lg shadow-[var(--saffron-glow)]">A</div>
            <h2 className="text-xl font-bold">Arjun Mehta</h2>
            <p className="text-gray-500 text-sm">Active since Mar 2026</p>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">First Aid Certified</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Logistics</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/3 card">
          <h3 className="font-bold border-b pb-4 mb-4">Availability Preferences</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 hover:bg-[var(--surface-2)] rounded-lg">
              <span>Weekends Only</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--saffron)]" />
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-[var(--surface-2)] rounded-lg">
              <span>Emergency Alerts via SMS</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--saffron)]" />
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-[var(--surface-2)] rounded-lg">
              <span>Willing to travel &gt; 50km</span>
              <input type="checkbox" className="w-5 h-5 accent-[var(--saffron)]" />
            </div>
          </div>
          <button className="mt-6 bg-[var(--saffron)] text-white px-6 py-2 rounded-lg font-bold" onClick={() => alert('Preferences Saved!')}>Save Changes</button>
        </div>
      </div>
      
    </div>
  );
}
