'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Bell, ShieldAlert, Clock, CheckCircle, MessageSquare, Send, User } from 'lucide-react';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Listen to Global Broadcasts
    const broadcastQuery = query(
      collection(db, 'broadcasts'),
      where('active', '==', true)
    );

    // 2. Listen to User Specific Notifications
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
      docs.sort((a: any, b: any) => {
        const timeA = a.created_at ? (typeof a.created_at.toDate === 'function' ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime()) : 0;
        const timeB = b.created_at ? (typeof b.created_at.toDate === 'function' ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime()) : 0;
        return timeB - timeA;
      });
      setNotifications(docs.slice(0, 20));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    // 3. Listen to Active Chats
    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id)
    );

    const unsubChats = onSnapshot(chatQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.updated_at ? (typeof a.updated_at.toDate === 'function' ? a.updated_at.toDate().getTime() : new Date(a.updated_at).getTime()) : 0;
        const timeB = b.updated_at ? (typeof b.updated_at.toDate === 'function' ? b.updated_at.toDate().getTime() : new Date(b.updated_at).getTime()) : 0;
        return timeB - timeA;
      });
      setChats(docs.slice(0, 5));
      setIsLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => {
      unsubBroadcasts();
      unsubNotifications();
      unsubChats();
    };
  }, [user]);

  if (isLoading) return <LoadingSkeleton type="page" />;

  const allItems = [...broadcasts, ...notifications];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--saffron)]" />
        <div>
          <h1 className="text-3xl font-black font-mukta text-[var(--ink)] tracking-tight flex items-center gap-3">
            <Bell className="text-[var(--saffron)]" /> Notifications
          </h1>
          <p className="text-[var(--ink-muted)] mt-1 font-medium italic">Direct updates from Sahaayak Command and your matched causes.</p>
        </div>
        <div className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
          {allItems.length} TOTAL EVENTS
        </div>
      </div>

      <div className="space-y-6">
        {chats.length > 0 && (
          <div className="space-y-3">
             <h2 className="text-[10px] font-black text-[var(--saffron)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <MessageSquare size={14} /> Active Conversations
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chats.map((chat) => (
                  <button 
                    key={chat.id} 
                    onClick={() => setActiveChat({ id: chat.participants.find((p: string) => p !== user?.id), name: 'NGO Coordinator' })}
                    className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[var(--saffron)] transition-all flex items-center gap-4 text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[var(--saffron-light)] group-hover:text-[var(--saffron)] transition-colors">
                      <User size={24} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm font-bold text-slate-900">NGO Coordinator</p>
                       <p className="text-[10px] text-slate-500 truncate">{chat.last_message || 'New coordination message'}</p>
                    </div>
                    <div className="text-[9px] font-bold text-[var(--saffron)]">
                       OPEN
                    </div>
                  </button>
                ))}
             </div>
          </div>
        )}

        {broadcasts.length > 0 && (
          <div className="space-y-3">
             <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Priority System Broadcasts
             </h2>
             {broadcasts.map((b) => (
               <div key={b.id} className="p-6 rounded-[2rem] bg-red-600 text-white shadow-xl shadow-red-900/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldAlert size={80} /></div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                       <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-widest">EMERGENCY DIRECTIVE</span>
                       <span className="text-[10px] font-bold opacity-80">{timeAgo(b.timestamp?.toDate())}</span>
                    </div>
                    <p className="text-lg font-bold leading-tight">{b.message}</p>
                 </div>
               </div>
             ))}
          </div>
        )}

        <div className="space-y-3 pt-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Recent Activity</h2>
          {notifications.length === 0 && broadcasts.length === 0 && (
             <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-300">
                <Bell className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-bold">All clear. No new notifications.</p>
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
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.type || 'SYSTEM UPDATE'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Real-time Chat Interface */}
      <AnimatePresence>
        {activeChat && (
          <ChatInterface 
            targetUserId={activeChat.id} 
            targetUserName={activeChat.name} 
            onClose={() => setActiveChat(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component wrapper for chat
function ChatWrapper({ activeChat, onClose }: { activeChat: any, onClose: () => void }) {
  return (
    <AnimatePresence>
      {activeChat && (
        <ChatInterface 
          targetUserId={activeChat.id} 
          targetUserName={activeChat.name} 
          onClose={onClose} 
        />
      )}
    </AnimatePresence>
  );
}
