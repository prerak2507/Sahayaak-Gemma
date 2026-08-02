'use client';
import React, { useState } from 'react';
import { 
  Building2, Search, Filter, ShieldCheck, Mail, Phone, 
  ExternalLink, MapPin, X, Award, CheckCircle2, FileText, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NGOData {
  id: number;
  name: string;
  type: string;
  d: string;
  s: string;
  h: string;
  reg: string;
  contact: string;
  email: string;
  phone: string;
  sectors: string[];
  bio: string;
  audits: string;
}

export default function Page() {
  const [selectedNgo, setSelectedNgo] = useState<NGOData | null>(null);

  const [ngoList, setNgoList] = useState<NGOData[]>([
    { 
        id: 1, name: 'Red Cross Delhi', type: 'Medical / Disaster', d: 'District Zone 1', 
        s: 'Verified', h: '98%', reg: 'FCRA-94827-GJ', contact: 'Dr. Ramesh Shah',
        email: 'contact@redcross-rajkot.org', phone: '+91 281 244 5566',
        sectors: ['Healthcare', 'Blood Bank', 'Emergency Rescue'],
        bio: 'Leading disaster response unit in Saurashtra region since 1994. Authorized for blood logistics and field surgery.',
        audits: 'Pass (Q3 2025)'
    },
    { 
        id: 2, name: 'Asha Relief Foundation', type: 'Food / Education', d: 'District Zone 2', 
        s: 'Verified', h: '94%', reg: 'TRUST-GJ-SUR-102', contact: 'Mrs. Leela Patel',
        email: 'info@asha-foundation.in', phone: '+91 99887 76655',
        sectors: ['Nutrition', 'Primary Education', 'Clothing'],
        bio: 'Focused on grassroots community support and child development centers across Surat and Delhi.',
        audits: 'Pass (Q2 2025)'
    },
    { 
        id: 3, name: 'Sanjeevani Social Hub', type: 'Healthcare Specialists', d: 'District Zone 1', 
        s: 'Pending Review', h: 'N/A', reg: 'REG-PENDING-420', contact: 'Vikram Singh',
        email: 'v.singh@sanjeevani.org', phone: '+91 88776 65544',
        sectors: ['Mental Health', 'Elderly Care'],
        bio: 'A newer organization specializing in geriatric support and psychological first aid during floods.',
        audits: 'Under Review'
    },
    { 
        id: 4, name: 'Disha Welfare Org', type: 'Women Empowerment', d: 'District Zone 4', 
        s: 'Verified', h: '88%', reg: 'NGO-8827-RJK', contact: 'Sneha Kapur',
        email: 'sneha@disha.org', phone: '+91 99001 12233',
        sectors: ['Vocational Training', 'Legal Aid'],
        bio: 'Providing livelihood support and legal counsel to women in underserved urban clusters.',
        audits: 'Pass (Q3 2025)'
    },
  ]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Institutional Registry</h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Official government records and compliance tracking for NGOs.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input type="text" placeholder="Search registry..." className="input pl-10" />
           </div>
           <button onClick={() => toast.success('Filtering by sector...')} className="p-3 bg-white border border-[var(--border)] rounded-xl hover:bg-gray-50 transition-colors"><Filter size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {ngoList.map((n, i) => (
            <div key={i} className="card p-8 flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden bg-white">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 opacity-10 rotate-45 translate-x-10 -translate-y-10 group-hover:bg-blue-600 transition-all" />
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm">{n.name[0]}</div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${n.s === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{n.s}</span>
               </div>
               <h3 className="text-xl font-bold font-mukta mb-2 group-hover:text-blue-600 transition-colors leading-tight">{n.name}</h3>
               <p className="border-l-2 border-blue-600 pl-3 text-xs font-bold text-gray-600 uppercase tracking-widest mb-6">{n.type}</p>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100"><p className="text-lg font-bold text-[var(--ink)]">{n.h}</p><p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Impact Score</p></div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100"><p className="text-lg font-bold text-blue-600">{n.d.split(' ')[2]}</p><p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Sector Zone</p></div>
               </div>

               <div className="flex gap-2">
                  <button onClick={() => setSelectedNgo(n)} className="flex-1 py-3 bg-[var(--surface)] text-[var(--ink)] rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-center gap-2 shadow-sm"><ExternalLink size={14} /> View Profile</button>
                  <button onClick={() => {
                      setNgoList(prev => prev.map(item => item.id === n.id ? { ...item, s: 'Auditing...', audits: 'Audit Initiated' } : item));
                      toast.success(`Official Audit Request sent to ${n.name}`);
                  }} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition-all">Audit</button>
               </div>
            </div>
         ))}
      </div>

      {/* INSTITUTIONAL NGO PROFILE MODAL */}
      {selectedNgo && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm" onClick={() => setSelectedNgo(null)} />
           <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
              
              {/* Profile Background & Status */}
              <div className="md:w-1/3 bg-blue-50 p-8 flex flex-col items-center text-center border-r border-blue-100">
                 <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-4xl font-bold text-blue-600 mb-6 shadow-xl border-4 border-white">{selectedNgo.name[0]}</div>
                 <h2 className="text-2xl font-bold font-mukta leading-tight mb-2">{selectedNgo.name}</h2>
                 <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-bold uppercase tracking-[2px] mb-8 shadow-md">Official Entity</span>
                 
                 <div className="w-full space-y-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Impact Score</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedNgo.h}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Last Audit</p>
                        <p className="text-sm font-bold text-green-600">{selectedNgo.audits}</p>
                    </div>
                 </div>
              </div>

              {/* Data Panel */}
              <div className="md:w-2/3 p-8 md:p-10 flex flex-col overflow-y-auto">
                 <button onClick={() => setSelectedNgo(null)} className="ml-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:text-[var(--ink)] transition-colors mb-2">&times;</button>
                 
                 <div className="space-y-6">
                    <section>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest mb-3"><FileText size={14} /> Institutional Bio</h4>
                        <p className="text-sm text-[var(--ink-muted)] leading-relaxed italic">"{selectedNgo.bio}"</p>
                    </section>

                    <section className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-4 bg-gray-50 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> Reg Number</h4>
                            <p className="text-xs font-bold text-blue-900">{selectedNgo.reg}</p>
                        </div>
                        <div className="space-y-1 p-4 bg-gray-50 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1"><Globe size={10} /> Compliance</h4>
                            <p className={`text-xs font-bold ${selectedNgo.s === 'Verified' ? 'text-green-600' : selectedNgo.s === 'Auditing...' ? 'text-amber-600 animate-pulse' : 'text-blue-600'}`}>{selectedNgo.s === 'Verified' ? 'STATE VERIFIED' : selectedNgo.s === 'Auditing...' ? 'AUDIT IN PROGRESS' : 'PENDING APPROVAL'}</p>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Operating Sectors</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedNgo.sectors.map((s: string) => (
                                <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1.5 underline-offset-4 decoration-2">
                                    <CheckCircle2 size={12} /> {s}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="p-6 bg-blue-900 text-white rounded-[24px] shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2"><Award size={14} /> Officer-in-Charge</h4>
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center font-bold">{selectedNgo.contact[0]}</div>
                               <div>
                                  <p className="font-bold text-sm">{selectedNgo.contact}</p>
                                  <p className="text-[10px] text-blue-300 opacity-80">NGO Lead Coordinator</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold"><Phone size={12} className="text-blue-400" /> {selectedNgo.phone}</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold truncate"><Mail size={12} className="text-blue-400" /> {selectedNgo.email}</div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-20 rotate-45 translate-x-16 -translate-y-16" />
                    </section>
                 </div>

                 <div className="mt-8 pt-8 border-t flex gap-3">
                    <button onClick={() => { 
                        setNgoList(prev => prev.map(item => item.id === selectedNgo.id ? { ...item, s: 'Auditing...', audits: 'Audit in progress via Government Portal.' } : item));
                        setSelectedNgo(null); 
                        toast.success('Institutional Audit initiated via Government Portal. Scanning compliance...'); 
                        
                        setTimeout(() => {
                            setNgoList(prev => prev.map(item => item.id === selectedNgo.id ? { ...item, s: 'Verified', audits: 'Pass (Just Now)' } : item));
                            toast.success(`Audit complete for ${selectedNgo.name}: State Compliance Verified!`, { icon: '✅' });
                        }, 4000);
                    }} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all">Mandatory Audit</button>
                    <button onClick={() => { setSelectedNgo(null); }} className="px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-colors">Close</button>
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
