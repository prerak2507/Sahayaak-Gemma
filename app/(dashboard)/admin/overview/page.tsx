'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Building2, AlertTriangle, 
  ArrowUpRight, Server, Globe2, Activity, CheckCircle2 
} from 'lucide-react';
import { collection, onSnapshot, query, where, limit, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';

export default function Page() {
  const [counts, setCounts] = useState({ needs: 0, ngos: 0, volunteers: 0, pending: 0 });
  const [pendingNgos, setPendingNgos] = useState<any[]>([]);

  useEffect(() => {
    const unsubNeeds = onSnapshot(collection(db, 'needs'), (snap) => {
      setCounts(prev => ({ ...prev, needs: snap.size }));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    const unsubNgos = onSnapshot(collection(db, 'ngos'), (snap) => {
      setCounts(prev => ({ ...prev, ngos: snap.size }));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
      setCounts(prev => ({ ...prev, volunteers: snap.size }));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    
    // NGO Verification Queue (Real-time)
    const q = query(collection(db, 'ngos'), where('verification_status', 'in', ['pending', 'under_review']), limit(5));
    const unsubQueue = onSnapshot(q, (snap) => {
      const queue = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingNgos(queue);
      setCounts(prev => ({ ...prev, pending: snap.size }));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => { 
      unsubNeeds(); 
      unsubNgos(); 
      unsubVolunteers();
      unsubQueue();
    };
  }, []);

  const handleApproveNGO = async (id: string, name: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'ngos', id), {
        verification_status: 'verified',
        verified_at: new Date().toISOString()
      });
      toast.success(`${name} verified successfully!`);
    } catch (error) {
      toast.error('Failed to verify NGO');
    }
  };
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Platform Nexus</h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Global system health and institutional governance overview.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-bold">
              <Server size={14} /> Node: AP-SOUTH-1 OK
           </div>
           <button onClick={() => toast.success('Running system-wide diagnostic...')} className="btn-primary">Diagnostic</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: 'Total Reports', v: counts.needs.toLocaleString(), t: '+12%', p: true, i: Globe2 },
          { l: 'Active NGOs', v: counts.ngos.toLocaleString(), t: '+8', p: true, i: Building2 },
          { l: 'Field Engineers', v: counts.volunteers.toLocaleString(), t: '+24', p: true, i: Users },
          { l: 'Pending Verification', v: counts.pending.toLocaleString(), t: 'ACTION', p: true, i: Shield },
        ].map((s, i) => (
          <div key={i} className="card p-6 hover:border-[var(--saffron)] transition-all">
             <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] mb-4"><s.i size={24} /></div>
             <p className="text-3xl font-bold font-mukta text-[var(--ink)]">{s.v}</p>
             <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                {s.l} <span className="text-green-500 font-bold">{s.t}</span>
             </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 card p-8 space-y-6">
            <h3 className="font-bold font-mukta text-xl">NGO Verification Queue</h3>
             <div className="space-y-4">
                {pendingNgos.map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] group hover:bg-white hover:shadow-lg transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm text-[var(--saffron)]">{n.name?.[0] || 'N'}</div>
                        <div>
                           <p className="font-bold text-sm">{n.name}</p>
                           <p className="text-[10px] text-gray-600 font-bold uppercase">{n.headquarters_city || 'Regional'} • Pending Review</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => window.location.href = `/admin/ngo-verify?id=${n.id}`} className="px-4 py-2 bg-white border border-[var(--border)] rounded-xl text-[10px] font-bold uppercase transition-colors hover:bg-gray-50">Review</button>
                        <button onClick={() => handleApproveNGO(n.id, n.name)} className="px-4 py-2 bg-[var(--saffron)] text-white rounded-xl text-[10px] font-bold uppercase shadow-md transition-opacity hover:opacity-90">Approve</button>
                     </div>
                  </div>
                ))}
                {pendingNgos.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest bg-gray-50 rounded-2xl border border-dashed">
                    No NGOs in Verification Queue
                  </div>
                )}
             </div>
         </div>

         <div className="card bg-[var(--ink)] text-white p-8 overflow-hidden relative border-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--saffron)] opacity-20 blur-3xl rounded-full translate-x-10 -translate-y-10" />
            <h3 className="font-bold font-mukta text-xl mb-4 relative z-10">Global Integrity Score</h3>
            <p className="text-sm text-gray-300 mb-8 relative z-10">Aggregate platform trust calculated from 82,000 verified volunteer interventions.</p>
            <div className="relative h-24 mb-10">
                <svg className="w-full h-full" viewBox="0 0 100 20">
                    <path d="M0,20 Q10,15 20,18 T40,10 T60,15 T80,5 T100,10" fill="none" stroke="var(--saffron)" strokeWidth="1" />
                </svg>
                <div className="absolute top-0 left-[75%] bg-[var(--saffron)] text-[var(--ink)] font-bold text-[10px] px-2 py-1 rounded">9.8/10</div>
            </div>
            <button className="btn-primary w-full shadow-none">View Governance Audit</button>
         </div>
      </div>
    </div>
  );
}
