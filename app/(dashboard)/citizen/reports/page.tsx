'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { MapPin, Clock, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // We fetch where user_phone matches. 
    // Due to missing index in demo, we can just fetch all and filter in memory if needed, 
    // but a query with where('user_phone', '==', user.phone) is proper.
    const q = query(collection(db, 'needs'), where('user_phone', '==', user.phone));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReports(list);
      setLoading(false);
    }, (err) => {
      console.warn("Failed to fetch reports natively", err);
      // Fallback
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Syncing Reports Vault...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 font-mukta">My Reports</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Track the live status of municipal issues you have reported.</p>
      </div>

      <div className="grid gap-6 mt-8">
        {reports.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No Reports Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">You haven't reported any civic issues yet. Once you do, you can track their real-time resolution progress here.</p>
          </div>
        ) : (
          reports.map(r => {
            const isCompleted = r.status === 'completed';
            const isAssigned = r.status === 'assigned';
            
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all relative overflow-hidden">
                {/* Status bar */}
                <div className={`absolute left-0 top-0 w-2 h-full ${isCompleted ? 'bg-emerald-500' : isAssigned ? 'bg-amber-500' : 'bg-blue-500'}`} />
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {r.category || 'General'}
                        </span>
                        {r.urgency_score > 7 && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                            <AlertTriangle size={10} /> High Urgency
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">{r.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <MapPin size={14} className="text-blue-500" />
                      {r.city || 'Local Zone'}, {r.ward || ''}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Clock size={14} className="text-amber-500" />
                      Reported: {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Resolution Status</p>
                  
                  {isCompleted ? (
                    <div className="bg-emerald-100/50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full"><CheckCircle2 size={16} /></div>
                      <div>
                        <p className="font-bold text-sm">Resolved</p>
                        <p className="text-[10px] uppercase tracking-wider">Issue Fixed & Verified</p>
                      </div>
                    </div>
                  ) : isAssigned ? (
                    <div className="bg-amber-100/50 border border-amber-200 text-amber-700 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-amber-500 text-white p-1.5 rounded-full"><AlertTriangle size={16} /></div>
                      <div>
                        <p className="font-bold text-sm">In Progress</p>
                        <p className="text-[10px] uppercase tracking-wider">Crew Dispatched</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-100/50 border border-blue-200 text-blue-700 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-blue-500 text-white p-1.5 rounded-full"><ShieldCheck size={16} /></div>
                      <div>
                        <p className="font-bold text-sm">Under Review</p>
                        <p className="text-[10px] uppercase tracking-wider">Awaiting City Action</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
