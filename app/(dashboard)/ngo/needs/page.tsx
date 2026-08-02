
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            All Active Needs
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="mt-6 card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-gray-500 uppercase text-xs">
            <tr><th className="p-4">Title</th><th className="p-4">Location</th><th className="p-4">Urgency</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {[
              { t: 'Require 50 units blood', l: 'Civil Hospital', u: 9.5, s: 'Critical' },
              { t: 'Textbook drive for orphans', l: 'West Zone Hub', u: 4.2, s: 'Open' },
              { t: 'Setup temporary tents', l: 'Riverfront', u: 7.8, s: 'In Progress' }
            ].map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-4 font-bold">{r.t}</td><td className="p-4">{r.l}</td>
                <td className="p-4"><div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${r.u * 10}%` }} /></div></td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-[var(--saffron-light)] text-[var(--saffron-dark)] text-xs font-bold">{r.s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
