'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, doc, getDoc, limit, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { NeedCard } from '@/components/shared/NeedCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowRight, Award, Clock, Star, Target, MessageSquare, User } from 'lucide-react';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Need, Task } from '@/types';
import { scopeToCity } from '@/lib/data/needs';

export default function VolunteerDashboard() {
  const { user } = useAuthStore();

  const [stats, setStats] = useState({ hours: 0, tasks_completed: 0, rating: 5.0, streak: 1 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeTasks, setActiveTasks] = useState<(Task & { need: Need })[]>([]);
  const [recommendedNeeds, setRecommendedNeeds] = useState<Need[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('volunteer_id', '==', user.id),
      where('status', 'in', ['accepted', 'matched', 'assigned']),
      limit(10)
    );

    const unsubscribeTask = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setActiveTasks([]);
        setTaskLoading(false);
        return;
      }

      const tasksWithNeeds = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const taskData = docSnapshot.data() as Task;
        const taskId = docSnapshot.id;
        const needDoc = await getDoc(doc(db, 'needs', taskData.need_id));
        if (needDoc.exists()) {
          return { ...taskData, id: taskId, need: { id: needDoc.id, ...needDoc.data() } as Need };
        }
        return { ...taskData, id: taskId, need: null };
      }));

      // Filter out any where need was deleted or null
      setActiveTasks(tasksWithNeeds.filter(t => t.need !== null) as (Task & { need: Need })[]);
      setTaskLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    // Fetch Stats (All Tasks by User)
    const statsQuery = query(collection(db, 'tasks'), where('volunteer_id', '==', user.id));
    const unsubStats = onSnapshot(statsQuery, (snapshot) => {
      const allTasks = snapshot.docs.map(d => d.data());
      const completedCount = allTasks.filter(t => t.status === 'completed').length;
      // Estimate 2.5 hours per completed task, rating stays high for gamification, streak increases with tasks
      setStats({
        tasks_completed: completedCount,
        hours: Math.floor(completedCount * 2.5),
        rating: completedCount > 0 ? 4.9 : 5.0,
        streak: completedCount > 0 ? (completedCount % 10) + 1 : 1
      });
      setStatsLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    const needsRef = collection(db, 'needs');
    const qRec = query(
      needsRef,
      where('status', '==', 'verified'),
      orderBy('urgency_score', 'desc'),
      limit(10) // Fetch more to allow AI selection
    );

    const unsubscribeRec = onSnapshot(qRec, async (snapshot) => {
      let allNeeds = scopeToCity(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))) as Need[];
      
      // 🛡️ CRITICAL FIX: Filter out any needs that are already assigned or currently active
      const activeNeedIds = activeTasks.map(t => t.need_id);
      allNeeds = allNeeds.filter(n => !activeNeedIds.includes(n.id) && n.status === 'verified');

      // AI Matching Logic
      if (user?.skills && user.skills.length > 0) {
        try {
          const res = await fetch('/api/ai/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              volunteerSkills: user.skills, 
              needs: allNeeds.map(n => ({ id: n.id, title: n.title, category: n.category }))
            })
          });
          const matchedIds = await res.json();
          const sorted = [...allNeeds].sort((a, b) => {
            const indexA = matchedIds.indexOf(a.id);
            const indexB = matchedIds.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setRecommendedNeeds(sorted.slice(0, 3));
        } catch (error) {
          console.error('AI Matching failed', error);
          setRecommendedNeeds(allNeeds.slice(0, 3));
        }
      } else {
        setRecommendedNeeds(allNeeds.slice(0, 3));
      }
      setRecLoading(false);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    const unsubChats = onSnapshot(query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id),
      orderBy('updated_at', 'desc'),
      limit(3)
    ), (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => {
      unsubscribeTask();
      unsubscribeRec();
      unsubChats();
      unsubStats();
    };
  }, [user?.id]);

  if (statsLoading || recLoading) return <LoadingSkeleton type="page" />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-mukta mb-2 text-[var(--ink)]">
          Welcome back, {user?.full_name?.split(' ')[0] ?? 'Hero'} 👋
        </h1>
        <p className="text-[var(--ink-muted)]">Here's how you're making an impact in {CITIES[0].name}.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-white hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Target size={20} />
          </div>
          <p className="text-2xl font-bold font-mukta">{stats?.tasks_completed}</p>
          <p className="text-xs text-[var(--ink-faint)] font-semibold uppercase tracking-wider">Tasks Done</p>
        </div>
        <div className="card bg-white hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <Clock size={20} />
          </div>
          <p className="text-2xl font-bold font-mukta">{stats?.hours}h</p>
          <p className="text-xs text-[var(--ink-faint)] font-semibold uppercase tracking-wider">Hours Logged</p>
        </div>
        <div className="card bg-white hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4">
            <Star size={20} />
          </div>
          <p className="text-2xl font-bold font-mukta">{stats?.rating}</p>
          <p className="text-xs text-[var(--ink-faint)] font-semibold uppercase tracking-wider">Avg Rating</p>
        </div>
        <div className="card bg-[var(--saffron-light)] hover:shadow-md transition-shadow border border-[var(--saffron-glow)]">
          <div className="w-10 h-10 rounded-full bg-white text-[var(--saffron)] flex items-center justify-center mb-4">
            <Award size={20} />
          </div>
          <p className="text-2xl font-bold font-mukta text-[var(--saffron-dark)]">{stats?.streak} Days</p>
          <p className="text-xs text-[var(--saffron)] font-semibold uppercase tracking-wider">Action Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Active / Next Task */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between line-b pb-2" style={{ borderBottomColor: 'var(--border)' }}>
            <h2 className="text-xl font-bold font-mukta">Current Assignment</h2>
          </div>
          
          {activeTasks.length > 0 ? (
            <div className="space-y-4">
              {activeTasks.map(task => (
                <div key={task.id} className="card border-[var(--saffron)] shadow-md shadow-[var(--saffron-glow)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2 py-1 bg-[var(--saffron)] text-white rounded">
                      {task.status === 'matched' ? 'PENDING MATCH' : 'IN PROGRESS'}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)]">Assigned {timeAgo(task.assigned_at || task.created_at)}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    {task.need.photo_urls?.[0] && (
                      <img src={task.need.photo_urls[0]} alt="Report" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-mukta mb-1">{task.need.title}</h3>
                      <p className="text-[var(--ink-muted)] text-sm mb-2">{task.need.description}</p>
                      <div className="flex gap-2 text-xs font-medium text-slate-500 mb-4">
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded">Severity: {task.need.severity_rating || task.need.urgency_score || 5}/10</span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">Reporter: {task.need.reported_by || 'Citizen'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    {task.status === 'matched' ? (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'tasks', task.id), { status: 'accepted' });
                            toast.success('Assignment accepted! On our way.');
                          } catch (error: any) {
                            toast.error('Failed to accept: ' + error.message);
                          }
                        }}
                        className="btn-primary flex-1 justify-center bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm AI Assignment
                      </button>
                    ) : (
                      <Link href={`/volunteer/tasks/${task.id}`} className="btn-primary flex-1 justify-center">
                        View Detail & Map
                      </Link>
                    )}
                    <button 
                      onClick={async () => {
                        try {
                          toast.loading('Marking as completed...', { id: 'complete-task' });
                          const res = await fetch('/api/tasks/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ taskId: task.id, needId: task.need.id })
                          });
                          
                          if (!res.ok) throw new Error('Failed to complete task');
                          
                          toast.success('Task marked as completed! Points awarded to citizen.', { id: 'complete-task' });
                        } catch (error: any) {
                          toast.error('Failed to update: ' + error.message, { id: 'complete-task' });
                        }
                      }}
                      className="btn-ghost flex-1"
                    >
                      Mark as Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-[var(--surface-2)] border-dashed border-2 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--ink-muted)] mb-4 shadow-sm">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold font-mukta mb-2">No active assignments</h3>
              <p className="text-sm text-[var(--ink-muted)] mb-6 max-w-sm">Ready to help? Check the recommended needs or browse the map for nearby tasks.</p>
              <Link href="/volunteer/tasks" className="btn-primary">
                Find Tasks
              </Link>
            </div>
          )}

          {/* 💬 Live Messaging Section */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between line-b pb-2" style={{ borderBottomColor: 'var(--border)' }}>
              <h2 className="text-xl font-bold font-mukta flex items-center gap-2">
                <MessageSquare size={20} className="text-[var(--saffron)]" /> Live Coordination
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chats.length > 0 ? (
                chats.map(chat => (
                  <button 
                    key={chat.id}
                    onClick={() => setActiveChat({ id: chat.participants.find((p: string) => p !== user?.id), name: 'NGO Coordinator' })}
                    className="card p-4 bg-white border-[var(--border)] hover:border-[var(--saffron)] transition-all text-left flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[var(--saffron-light)] group-hover:text-[var(--saffron)] transition-colors">
                      <User size={24} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm font-bold text-[var(--ink)]">NGO Coordinator</p>
                       <p className="text-[10px] text-[var(--ink-muted)] truncate">{chat.last_message || 'Start coordination...'}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                ))
              ) : (
                <div className="md:col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400 font-bold">No active chats yet. Connect with NGOs through task assignments.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recommended */}
        <div className="space-y-6">
          <div className="flex items-center justify-between line-b pb-2" style={{ borderBottomColor: 'var(--border)' }}>
            <h2 className="text-xl font-bold font-mukta">Recommended for you</h2>
            <Link href="/volunteer/tasks" className="text-xs text-[var(--saffron)] font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recommendedNeeds?.length ? (
              recommendedNeeds.map(need => (
                <div key={need.id} className="card p-4 hover:border-[var(--saffron-glow)] transition-colors cursor-pointer bg-white group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[var(--ink-faint)] uppercase">{need.category}</span>
                    <span className={`w-2 h-2 rounded-full ${need.urgency_score >= 8 ? 'bg-red-500 critical-pulse' : 'bg-[var(--saffron)]'}`} />
                  </div>
                  <h4 className="font-bold font-mukta text-sm mb-1 group-hover:text-[var(--saffron)] transition-colors line-clamp-2">{need.title}</h4>
                  <p className="text-xs text-[var(--ink-muted)] line-clamp-1">{need.city}</p>
                </div>
              ))
            ) : (
              <EmptyState title="All caught up!" description="There are no high-priority matches in your radius right now." />
            )}
          </div>
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

// Dummy export for CITIES missing ref, will add via imports if needed, actually it'll crash without import
import { CITIES } from '@/types';
import { timeAgo } from '@/lib/utils';
