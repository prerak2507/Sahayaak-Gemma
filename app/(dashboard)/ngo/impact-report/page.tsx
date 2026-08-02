'use client';
import React, { useState } from 'react';
import { 
  FileText, FileDown, Eye, Sparkles, CheckCircle2, 
  Layout, Calendar, ShieldCheck, ChevronRight, Share2, 
  Trash2, Filter, Search, BarChart4, Globe2, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Page() {
  const [activeTab, setActiveTab] = useState('generate');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('CSR');

  const templates = [
    { id: 'CSR', title: 'CSR Compliance Audit', desc: 'Standardized format for corporate donors and CSR fund audits.', color: 'border-indigo-500 bg-indigo-50' },
    { id: 'GOVT', title: 'Govt SDG Reporting', desc: 'Mapped to NITI Aayog guidelines for sustainable development goals.', color: 'border-blue-500 bg-blue-50' },
    { id: 'ANNUAL', title: 'Annual Impact Review', desc: 'Comprehensive yearly report for stakeholders and public website.', color: 'border-purple-500 bg-purple-50' },
  ];

  const recentReports = [
    { name: 'Impact_Report_Q3_Delhi.pdf', date: 'Oct 12, 2025', size: '2.4 MB', type: 'CSR' },
    { name: 'Disaster_Relief_Flood_Audit.pdf', date: 'Sep 28, 2025', size: '1.8 MB', type: 'GOVT' },
    { name: 'Volunteer_Effort_Log_Sep.pdf', date: 'Sep 05, 2025', size: '4.2 MB', type: 'INTERNAL' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Impact & Compliance</h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Verify contributions, audit SDG impacts, and generate certified reports.</p>
        </div>
        <div className="flex bg-white border border-[var(--border)] rounded-2xl p-1 shadow-sm">
           <button onClick={() => setActiveTab('generate')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-[var(--ink)]'}`}>Builder</button>
           <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-[var(--ink)]'}`}>Vault History</button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* LEFT: TEMPLATE SELECTOR */}
           <div className="lg:col-span-2 space-y-8">
              <section className="space-y-4">
                 <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-indigo-600"><Layout size={20} /> 1. Select Report Framework</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map(t => (
                       <div 
                        key={t.id} 
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === t.id ? t.color : 'bg-white border-[var(--border)] opacity-60 hover:opacity-100'}`}
                       >
                          <div className={`w-8 h-8 rounded-lg mb-4 flex items-center justify-center ${selectedTemplate === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-100 text-gray-600'}`}><FileText size={18} /></div>
                          <h4 className="font-bold text-sm mb-2">{t.title}</h4>
                          <p className="text-[10px] text-gray-500 leading-relaxed">{t.desc}</p>
                       </div>
                    ))}
                 </div>
              </section>

              <section className="space-y-4">
                 <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-indigo-600"><ShieldCheck size={20} /> 2. Audit Parameters</h3>
                 <div className="card p-8 bg-white space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">Date Range</label><input type="date" className="input bg-gray-50 border-gray-100" defaultValue="2025-07-01" /></div>
                       <div><label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">Region Scope</label><select className="input bg-gray-50 border-gray-100 font-bold text-sm"><option>Whole District (Delhi)</option><option>West Zone Only</option><option>State Level</option></select></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600"><Sparkles size={20} /></div>
                          <div>
                             <p className="font-bold text-sm text-indigo-900">Include Blockchain Traceability</p>
                             <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Signed NFT Certificates for Field Engineers</p>
                          </div>
                       </div>
                       <input type="checkbox" defaultChecked className="w-6 h-6 accent-indigo-600" />
                    </div>
                 </div>
              </section>

              <div className="flex gap-4">
                 <button 
                  onClick={() => { toast.loading('Synthesizing metrics...'); setTimeout(() => setIsPreviewOpen(true), 1500); }} 
                  className="flex-1 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
                 >
                    <Eye size={20} /> Preview Live Data
                 </button>
                 <button 
                    onClick={() => { toast.loading('Generating Certified PDF...', { duration: 2500 }); setTimeout(() => toast.success('Report #SST-0924 Downloaded!'), 2500); }}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                 >
                    <FileDown size={20} /> Finalize & Export PDF
                 </button>
              </div>
           </div>

           {/* RIGHT: LIVE IMPACT METRICS */}
           <div className="space-y-6">
              <h3 className="text-lg font-bold font-mukta">Live Impact Metrics</h3>
              <div className="card p-6 space-y-6 bg-[var(--sidebar-bg)] border-none text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                 
                 {[
                    { l: 'Total Field Engineers Audited', v: '4,102', i: <Users size={16} /> },
                    { l: 'SDG Goals Impacted', v: '12', i: <Globe2 size={16} /> },
                    { l: 'Public Trust Score', v: '9.8/10', i: <ShieldCheck size={16} /> },
                 ].map((m, i) => (
                    <div key={i} className="relative z-10">
                       <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-1">{m.i} {m.l}</p>
                       <p className="text-3xl font-bold font-mukta text-white">{m.v}</p>
                    </div>
                 ))}

                 <div className="pt-6 border-t border-white/10 relative z-10 space-y-3">
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Sustainability Contributions</p>
                    <div className="flex gap-2">
                       <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg border border-blue-400">01</span>
                       <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg border border-green-400">03</span>
                       <span className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg border border-orange-400">11</span>
                       <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg border border-red-400">13</span>
                    </div>
                 </div>
              </div>

              <div className="card p-6 border-dashed border-indigo-200">
                 <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><BarChart4 size={16} className="text-indigo-600" /> Auto-Scheduler</h4>
                 <p className="text-[10px] text-gray-500 leading-relaxed mb-4">You have a recurring CSR audit scheduled for the first Monday of every quarter.</p>
                 <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Manage Schedules</button>
              </div>
           </div>
        </div>
      ) : (
        /* VAULT HISTORY VIEW */
        <div className="space-y-6">
           <div className="flex gap-4 items-center mb-10">
              <div className="relative flex-1">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                 <input type="text" placeholder="Search report library..." className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-[var(--border)] outline-none" />
              </div>
              <button className="p-3 bg-white rounded-2xl border border-[var(--border)]"><Filter size={20} className="text-gray-600" /></button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {recentReports.map((r, i) => (
                 <div key={i} className="card p-6 flex items-center justify-between group hover:border-indigo-600 transition-all cursor-default">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                       <div>
                          <h3 className="font-bold text-lg text-[var(--ink)]">{r.name}</h3>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                             <span className="flex items-center gap-1"><Calendar size={12} /> {r.date}</span>
                             <span>•</span>
                             <span>{r.size}</span>
                             <span>•</span>
                             <span className="text-indigo-600">{r.type} AUDIT</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => toast.success('Opening shareable secure link...')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors"><Share2 size={16} /></button>
                       <button onClick={() => toast.success('Report downloaded from vault.')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors"><FileDown size={16} /></button>
                       <button onClick={() => toast.error('Reports cannot be deleted for 5 years per compliance.')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* FULL-MODAL PREVIEW */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md" onClick={() => setIsPreviewOpen(false)} />
           <div className="relative bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-500">
              
              <div className="p-8 border-b flex justify-between items-center bg-white relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText size={24} /></div>
                    <div>
                       <h2 className="text-xl font-bold font-mukta">Impact_Preview_v2.0.pdf</h2>
                       <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <CheckCircle2 size={12} className="text-green-500" /> SECURE AUDIT MODE • NOT YET SIGNED
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-3xl font-light">&times;</button>
              </div>

              <div className="flex-1 bg-gray-100 p-8 md:p-16 overflow-y-auto flex flex-col items-center gap-12">
                 {/* Page 1 */}
                 <div className="w-full max-w-2xl aspect-[1/1.414] bg-white shadow-2xl p-12 md:p-20 space-y-12 shrink-0">
                    <div className="flex justify-between border-b-8 border-indigo-600 pb-8 items-end">
                       <div className="space-y-1">
                          <h1 className="text-5xl font-black font-mukta text-indigo-700 leading-none">IMPACT<br/>AUDIT</h1>
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[6px]">SAHAAYAK PROTOCOL</p>
                       </div>
                       <div className="text-right">
                          <p className="text-3xl font-black text-gray-800">2025</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Q3 QUARTERLY REVIEW</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-8">
                       <section className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Verified SDG Goals</h3>
                          <div className="grid grid-cols-2 gap-2">
                             {[1, 2, 3, 5, 8, 12, 13, 17].map(g => (
                                <div key={g} className="h-10 bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-400">#{g}</div>
                             ))}
                          </div>
                       </section>
                       <section className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Operational Scope</h3>
                          <div className="space-y-3">
                             <div className="flex justify-between items-end"><p className="text-xs font-bold">Fulfillment</p><p className="text-xl font-bold text-indigo-600">92%</p></div>
                             <div className="h-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 w-[92%]" /></div>
                             <p className="text-[8px] text-gray-600 leading-tight">Calculated across 4,102 verified individual human volunteer interventions in the Delhi district sector.</p>
                          </div>
                       </section>
                    </div>

                    <div className="pt-20 border-t border-gray-100 flex justify-between items-center opacity-30">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                          <div className="space-y-2"><div className="w-24 h-3 bg-gray-100 rounded-full" /><div className="w-32 h-2 bg-gray-100 rounded-full" /></div>
                       </div>
                       <ChevronRight className="text-gray-200" />
                    </div>
                 </div>

                 {/* Page 2 (Teaser) */}
                 <div className="w-full max-w-2xl aspect-[1/1.414] bg-white/60 shadow-xl p-12 md:p-20 space-y-12 shrink-0 blur-[2px] scale-95 origin-top">
                    <h2 className="text-2xl font-bold border-b-2 pb-4 border-gray-100">Statistical Heatmap</h2>
                    <div className="h-64 bg-gray-100/40 rounded-3xl" />
                 </div>
              </div>

              <div className="p-8 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 shadow-[0_-10px_50px_rgba(0,0,0,0.05)]">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="text-indigo-600" />
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[2px]">Verification Pending • Blockchain Signature Ready</div>
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setIsPreviewOpen(false)} className="flex-1 md:flex-none px-10 py-4 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">Discard</button>
                    <button 
                       onClick={() => { setIsPreviewOpen(false); toast.success('Report successfully signed & exported!'); }}
                       className="flex-1 md:flex-none px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                       <FileDown size={18} /> Sign & Download PDF
                    </button>
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
