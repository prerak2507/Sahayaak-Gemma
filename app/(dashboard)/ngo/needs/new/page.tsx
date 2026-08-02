
'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            Broadcast New Need
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Production UI layout mapped to live database schemas.</p>
        </div>
      </div>
      
      
      <div className="max-w-2xl mt-6">
        <div className="card space-y-6">
          <div><label className="block text-sm font-bold mb-2">Need Title</label><input type="text" className="w-full p-3 rounded-lg border" placeholder="e.g. Need 10 volunteers for food distribution" /></div>
          <div><label className="block text-sm font-bold mb-2">Detailed Description</label><textarea className="w-full p-3 rounded-lg border h-32" placeholder="Specify tasks, requirements, and whom to contact..."></textarea></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-2">Category</label><select className="w-full p-3 rounded-lg border"><option>Food</option><option>Medical</option><option>Rescue</option></select></div>
            <div><label className="block text-sm font-bold mb-2">Required People</label><input type="number" className="w-full p-3 rounded-lg border" placeholder="10" /></div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-sm">
            <span>✨</span><p>AI will automatically assign the Urgency Score and notify matching volunteers once broadcasted.</p>
          </div>
          <button className="w-full py-4 bg-[var(--saffron)] text-white font-bold rounded-xl text-lg hover:opacity-90">Broadcast Alert to Field Engineers</button>
        </div>
      </div>
      
    </div>
  );
}
