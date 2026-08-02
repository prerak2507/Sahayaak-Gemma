'use client';
import React from 'react';
import { FileText, FileDown, CheckCircle2, Search, Calendar, Filter, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateOfficialReport } from '@/lib/pdfGenerator';

export default function Page() {
  const reports = [
    { title: 'District Relief Audit Q3', date: 'Oct 12, 2025', size: '4.2 MB', code: 'SST-GAZ-94' },
    { title: 'NGO Compliance Log', date: 'Oct 01, 2025', size: '1.2 MB', code: 'SST-GAZ-88' },
    { title: 'Flood Mitigation Analysis', date: 'Sep 22, 2025', size: '12.8 MB', code: 'SST-GAZ-82' },
    { title: 'Field Engineer Contribution NFT Sign', date: 'Sep 15, 2025', size: '0.8 MB', code: 'SST-GAZ-77' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen">
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6">
        <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Placeholder screen</p>
        <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">This screen is a layout placeholder. Live report data is on the Task Board, the District Map and the Audit Trail.</p>
      </div>
      <div className="flex justify-between items-end">
         <div><h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Official Gazette</h1><p className="text-[var(--ink-muted)]">Signed legislative documentation and operational audits.</p></div>
         <button onClick={() => toast.success('Syncing with state archives...')} className="btn-primary flex items-center gap-2"><Archive size={18} /> State Archive</button>
      </div>

      <div className="flex gap-4 mb-6">
         <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" /><input type="text" placeholder="Search gazette ID or keyword..." className="input pl-12 bg-white" /></div>
         <button className="p-3 bg-white border border-[var(--border)] rounded-xl hover:bg-gray-50 transition-colors"><Filter size={20} className="text-gray-600" /></button>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {reports.map((r, i) => (
            <div key={i} className="card p-6 flex items-center justify-between hover:border-blue-600 transition-all group cursor-default">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><FileText size={28} /></div>
                  <div>
                     <h3 className="font-bold text-lg text-[var(--ink)]">{r.title}</h3>
                     <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {r.date}</span>
                        <span>•</span>
                        <span>{r.size}</span>
                        <span>•</span>
                        <span className="text-blue-600">{r.code}</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => toast.success('Opening secure viewer...')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors border border-[var(--border)]"><FileText size={18} /></button>
                  <button onClick={() => {
                    generateOfficialReport({
                      title: r.title,
                      referenceNo: r.code,
                      date: r.date,
                      category: 'Municipal Governance Audit'
                    });
                    toast.success('Live PDF Generated Successfully!');
                  }} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><FileDown size={16} /> Official PDF</button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
