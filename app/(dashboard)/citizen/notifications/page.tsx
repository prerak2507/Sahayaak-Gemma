'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { Bell, ShieldAlert, Activity, CheckCircle2, Star } from 'lucide-react';

export default function CitizenNotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In demo mode, fetch recent notifications globally or for citizen
    const q = query(collection(db, 'notifications'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // No invented notifications. Telling a resident their KYC was verified,
      // or that a rain warning has been issued, when neither happened is worse
      // than an empty inbox.
      setNotifications(list);
      setLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsub();
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Activity className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-mukta">Municipal Alerts</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Updates on your reports and critical city-wide broadcasts.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-blue-200">
          <Bell size={16} /> {notifications.filter(n => !n.is_read).length} Unread
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((n, i) => {
          const isCritical = n.type === 'CRITICAL' || n.type === 'WARNING';
          const isSuccess = n.type === 'SUCCESS';
          return (
            <div key={n.id || i} className={`p-5 rounded-2xl border transition-all ${!n.is_read ? 'bg-white shadow-md border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-xl ${isCritical ? 'bg-red-100 text-red-600' : isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {isCritical ? <ShieldAlert size={20} /> : isSuccess ? <CheckCircle2 size={20} /> : <Star size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${!n.is_read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title || n.type}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
