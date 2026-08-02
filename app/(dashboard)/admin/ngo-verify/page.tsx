'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react';

export default function Page() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ngos'), where('verification_status', 'in', ['pending', 'under_review']));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setNgos([
          { id: 'demo-1', name: 'Helping Hands Foundation', registration_no: '88/RJ/2024', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), verification_status: 'pending' },
          { id: 'demo-2', name: 'Saurashtra Relief Hub', registration_no: 'NGO-4421-B', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), verification_status: 'under_review' },
          { id: 'demo-3', name: 'Niti Seva Kendra', registration_no: 'REG-9910-S', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), verification_status: 'pending' }
        ]);
      } else {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNgos(data);
      }
      setLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'ngos', id), {
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null
      });
      toast.success(`NGO ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mukta text-[var(--ink)] tracking-tight">
            Institutional Verification Queue
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium">Review legal documentation and authorize NGO access to the Sahaayak network.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold uppercase tracking-widest">
          <Shield size={14} /> Compliance Mode
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-600">Loading verification queue...</div>
        ) : ngos.map((n) => (
          <div 
            key={n.id} 
            className={`card flex flex-col md:flex-row items-center justify-between p-6 transition-all hover:shadow-lg ${highlightId === n.id ? 'ring-2 ring-[var(--saffron)] bg-orange-50/30' : ''}`}
          >
            <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center font-bold text-xl text-[var(--ink-muted)] shadow-inner">
                {n.name?.[0] || 'N'}
              </div>
              <div>
                <h3 className="font-bold text-lg font-mukta text-[var(--ink)]">{n.name}</h3>
                <div className="flex flex-wrap gap-4 mt-1">
                  <p className="text-[10px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                    <FileText size={10} /> {n.registration_no || 'REG-PENDING'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={10} /> Applied: {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => handleUpdateStatus(n.id, 'rejected')}
                className="flex-1 md:flex-none px-6 py-3 text-xs text-red-600 bg-white border border-red-100 rounded-xl font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={14} /> Reject
              </button>
              <button 
                onClick={() => handleUpdateStatus(n.id, 'verified')}
                className="flex-1 md:flex-none px-6 py-3 text-xs text-white bg-green-600 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Approve & Whitelist
              </button>
            </div>
          </div>
        ))}
        
        {!loading && ngos.length === 0 && (
          <div className="bg-[var(--surface-2)] rounded-3xl border-2 border-dashed border-[var(--border)] p-20 text-center">
            <Shield className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-xl font-bold font-mukta text-gray-600">All NGOs Verified</p>
            <p className="text-sm text-gray-600 mt-2">The verification queue is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
