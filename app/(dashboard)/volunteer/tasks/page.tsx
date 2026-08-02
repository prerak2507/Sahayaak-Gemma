'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, limit } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, X, CheckCircle2, Zap, Activity } from 'lucide-react';
import { Need } from '@/types';
import { UrgencyBadge } from '@/components/shared/UrgencyBadge';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { scopeToCity } from '@/lib/data/needs';

export default function VolunteerTasks() {
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchNeeds = async () => {
      try {
        const res = await fetch('/api/needs?assignment=all&limit=300');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const liveNeeds: Need[] = data.needs || [];
        setNeeds(liveNeeds);
        setIsLoading(false);
      } catch (err) {
        console.warn('Failed to load volunteer needs from API:', err);
        setIsLoading(false);
      }
    };
    fetchNeeds();
    const interval = setInterval(fetchNeeds, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const handleAction = async (direction: 'left' | 'right') => {
    if (isSwiping || !needs || currentIndex >= needs.length) return;
    const need = needs[currentIndex];
    setIsSwiping(true);

    if (direction === 'right') {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const taskRef = doc(collection(db, 'tasks'));
          await setDoc(taskRef, {
            id: taskRef.id,
            need_id: need.id,
            volunteer_id: user?.id,
            status: 'accepted',
            assigned_at: new Date().toISOString()
          });
          await updateDoc(doc(db, 'needs', need.id), { status: 'in_progress' });
          setCurrentIndex(prev => prev + 1);
          resolve(true);
        } catch (error) { reject(error); }
      });
      toast.promise(promise, {
        loading: 'Locking coordinates...',
        success: 'Mission Accepted!',
        error: 'Failed to accept task.'
      });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    setTimeout(() => setIsSwiping(false), 300);
  };

  if (isLoading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-red-600 animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Global Grid...</p>
    </div>
  );

  if (!needs || currentIndex >= needs.length) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-xl">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-3xl font-black font-mukta mb-2 text-slate-900">All Sectors Clear</h2>
      <p className="text-slate-500 font-medium mb-8">You've successfully reviewed all active needs in your area. Great work!</p>
      <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
         <Activity size={12} className="animate-pulse" /> Grid Monitor: ACTIVE
      </div>
    </div>
  );

  const currentNeed = needs[currentIndex];

  return (
    <div className="flex flex-col items-center py-8 px-4 max-w-2xl mx-auto w-full min-h-screen">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black font-mukta text-slate-900 leading-none mb-1">Discover Tasks</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Node</span>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
          {needs.length - currentIndex} MISSION{needs.length - currentIndex > 1 ? 'S' : ''} REMAINING
        </div>
      </div>

      {/* Swipe Container */}
      <div className="w-full max-w-md relative flex-1 flex flex-col min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNeed.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              x: isSwiping ? (currentIndex % 2 === 0 ? 500 : -500) : 0, 
              opacity: 0, 
              scale: 0.8,
              rotate: isSwiping ? (currentIndex % 2 === 0 ? 20 : -20) : 0
            }}
            className="w-full bg-white rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col h-full"
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                {currentNeed.category}
              </span>
              <UrgencyBadge score={currentNeed.urgency_score} />
            </div>

            <div className="flex-1 px-8 pb-8 flex flex-col">
              <h2 className="text-3xl font-black font-mukta mb-4 text-slate-900 leading-none tracking-tight">{currentNeed.title}</h2>
              
              <div className="flex-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 mb-6 min-h-[150px]">
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                  "{currentNeed.description}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector</p>
                   <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-red-500" /> {currentNeed.city}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged</p>
                   <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {timeAgo(currentNeed.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />
          </motion.div>
        </AnimatePresence>

        {/* Buttons - Fixed relative to card bottom */}
        <div className="flex justify-center items-center gap-8 py-10">
          <button 
            disabled={isSwiping}
            onClick={() => handleAction('left')}
            className="w-16 h-16 rounded-[1.8rem] bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all active:scale-90"
          >
            <X size={32} />
          </button>
          
          <button 
            disabled={isSwiping}
            onClick={() => handleAction('right')}
            className="w-20 h-20 rounded-[2.2rem] bg-slate-900 shadow-2xl flex items-center justify-center text-white hover:bg-red-600 transition-all active:scale-95 group relative"
          >
            <Zap size={32} className="group-hover:scale-125 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
          </button>
        </div>
      </div>
      
    </div>
  );
}
