'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { Bell, ShieldAlert, Clock, CheckCircle } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const broadcastQuery = query(
      collection(db, 'broadcasts'),
      where('active', '==', true)
    );

    const notificationQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.id)
    );

    const unsubBroadcasts = onSnapshot(broadcastQuery, (snapshot) => {
      const activeBroadcasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isBroadcast: true }));
      // Sort in-memory by timestamp descending
      activeBroadcasts.sort((a: any, b: any) => {
        const timeA = a.timestamp ? (typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime()) : 0;
        const timeB = b.timestamp ? (typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime()) : 0;
        return timeB - timeA;
      });
      setBroadcasts(activeBroadcasts.slice(0, 5));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    const unsubNotifications = onSnapshot(notificationQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in-memory by created_at descending to bypass composite index requirement
      docs.sort((a: any, b: any) => {
        const timeA = a.created_at ? (typeof a.created_at.toDate === 'function' ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime()) : 0;
        const timeB = b.created_at ? (typeof b.created_at.toDate === 'function' ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime()) : 0;
        return timeB - timeA;
      });
      setNotifications(docs.slice(0, 20));
      setIsLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => {
      unsubBroadcasts();
      unsubNotifications();
    };
  }, [user]);

  if (isLoading) return <LoadingSkeleton type="page" />;

  const allItems = [...broadcasts, ...notifications];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
        <div>
          <h1 className="text-3xl font-black font-mukta text-[var(--ink)] tracking-tight flex items-center gap-3">
            <Bell className="text-emerald-600" /> Organization Alerts
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium italic">Command updates and volunteer coordination alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {broadcasts.length > 0 && (
          <div className="space-y-3">
             <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Emergency Broadcasts
             </h2>
             {broadcasts.map((b) => (
               <div key={b.id} className="p-6 rounded-[2rem] bg-red-600 text-white shadow-xl shadow-red-900/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldAlert size={80} /></div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                       <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-widest">COMMAND CENTER BROADCAST</span>
                       <span className="text-[10px] font-bold opacity-80">{timeAgo(b.timestamp?.toDate())}</span>
                    </div>
                    <p className="text-lg font-bold leading-tight">{b.message}</p>
                 </div>
               </div>
             ))}
          </div>
        )}

        <div className="space-y-3 pt-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Operational Notifications</h2>
          {notifications.length === 0 && broadcasts.length === 0 && (
             <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-300">
                <Bell className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-bold">No active notifications.</p>
             </div>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`p-5 rounded-2xl border transition-all hover:translate-x-1 ${n.is_read ? 'bg-[var(--surface-2)] border-[var(--border)] opacity-70' : 'bg-white border-blue-200 shadow-sm'}`}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {n.type === 'SUCCESS' ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-bold text-slate-900'}`}>{n.text}</p>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-4">{timeAgo(n.created_at?.toDate())}</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.type || 'NGO ACTIVITY'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
