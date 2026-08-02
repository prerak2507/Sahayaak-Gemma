'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, MapPin, Award, AlertCircle, Camera, 
  CheckCircle2, Clock, History, Activity, ThumbsUp, ThumbsDown, ArrowUpRight, Flame, Skull, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, increment, arrayUnion, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Need } from '@/types';

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my_reports' | 'community'>('my_reports');
  const [stats, setStats] = useState({ issuesReported: 0, resolved: 0, trustPoints: user?.trust_points || 50, falseReports: user?.false_reports_count || 0, rank: 'Bronze Contributor (New)' });
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [topCitizens, setTopCitizens] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch Live User Gamification Stats
    const unsubUser = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const score = data.trust_points ?? 50;
        const falseReports = data.false_reports_count ?? 0;
        let rank = 'Bronze Contributor';
        if (score > 500) rank = 'Gold Contributor';
        else if (score > 200) rank = 'Silver Contributor';
        
        if (data.badges?.includes('Civic Guardian')) {
          rank = 'Civic Guardian 🛡️';
        }

        setStats(prev => ({ ...prev, trustPoints: score, falseReports, rank }));
      }
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    // 2. Fetch My Reports
    const qMy = query(collection(db, 'needs'), where('reported_by', '==', user.id), orderBy('created_at', 'desc'), limit(10));
    const unsubMy = onSnapshot(qMy, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMyIssues(issues);
      const resolved = issues.filter(i => i.status === 'completed').length;
      setStats(prev => ({ ...prev, issuesReported: issues.length, resolved }));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    // 3. Fetch Top Citizens Leaderboard
    const qLeaders = query(collection(db, 'users'), orderBy('trust_points', 'desc'), limit(3));
    const unsubLeaders = onSnapshot(qLeaders, (snapshot) => {
      const leaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopCitizens(leaders);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => { unsubUser(); unsubMy(); unsubLeaders(); };
  }, [user?.id]);

  const isSuspended = stats.falseReports >= 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pt-8 pb-20">
      
      {/* Header Profile Section */}
      <div className={`bg-white rounded-3xl p-8 border ${isSuspended ? 'border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-slate-200 shadow-sm'} flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-2 h-full ${isSuspended ? 'bg-red-500' : 'bg-blue-500'}`}></div>
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl ${isSuspended ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'} flex items-center justify-center shadow-inner`}>
            {isSuspended ? <Skull size={40} /> : <ShieldCheck size={40} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-800 font-mukta">Hello, {user?.full_name || 'Citizen'}</h1>
              {isSuspended ? (
                <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200 animate-pulse">
                  <AlertCircle size={10} /> Suspended
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 size={10} /> Aadhar Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MapPin size={12} /> Delhi NCR | UID: **** **** 1234
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className={`text-center px-6 py-3 rounded-2xl border ${isSuspended ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isSuspended ? 'text-red-400' : 'text-slate-400'}`}>Trust Points</p>
            <p className={`text-2xl font-black ${isSuspended ? 'text-red-600' : 'text-blue-600'}`}>{stats.trustPoints}</p>
          </div>
          <div className="text-center px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100 hidden sm:block">
            <p className="text-[10px] font-black uppercase text-amber-600/60 tracking-wider mb-1">Tier Level</p>
            <p className="text-lg font-black text-amber-600 flex items-center gap-1">
              <Award size={18} /> {isSuspended ? 'Revoked' : stats.rank}
            </p>
          </div>
        </div>
      </div>

      {isSuspended && (
        <div className="bg-red-900 text-white rounded-3xl p-6 shadow-xl flex items-start gap-4">
          <AlertCircle size={32} className="text-red-400 shrink-0" />
          <div>
            <h3 className="text-lg font-black tracking-wider uppercase text-red-100 mb-1">Account Suspended: Too Many False Reports</h3>
            <p className="text-red-200/80 text-sm leading-relaxed">
              You have issued {stats.falseReports} invalid/false reports. Your account has been suspended from reporting new issues and voting on community issues to protect the integrity of the civic system.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center Column - Report & History */}
        <div className="lg:col-span-2 space-y-6">
          
          <Link href="/report" className={`block w-full ${isSuspended ? 'bg-slate-400 pointer-events-none' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-3xl p-8 shadow-md transition-all active:scale-95 group relative overflow-hidden text-left no-underline`}>
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform -mr-6 -mb-6">
              <Camera size={140} />
            </div>
            <Camera size={32} className="mb-4" />
            <h3 className="text-2xl font-black font-mukta mb-2">Report a New Issue</h3>
            <p className="text-sm text-blue-100 font-medium max-w-sm">Spotted a pothole, garbage, or water logging? Snap a photo to alert authorities.</p>
          </Link>

          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="flex border-b border-slate-200 p-4 bg-slate-50">
               <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                 <History size={16} className="text-blue-500" /> My Recent Reports
               </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                  {myIssues.map((issue) => (
                    <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          issue.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                          issue.status === 'in_progress' || issue.status === 'assigned' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                          'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          {issue.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 font-mukta text-sm mb-0.5">{issue.title}</h4>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Today'} • <span className={
                              issue.status === 'completed' ? 'text-emerald-500' :
                              issue.status === 'in_progress' || issue.status === 'assigned' ? 'text-amber-500' :
                              'text-blue-500'
                            }>{issue.status.replace('_', ' ').toUpperCase()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-black">
                          <ThumbsUp size={12} /> {issue.upvotes || 0}/25
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((issue.upvotes || 0) / 25) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {myIssues.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">No reports yet. Start reporting to earn points!</div>
                  )}
                </div>
              </div>
            </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingUp size={100} />
            </div>
            <div className="relative z-10 flex gap-4 items-start">
              <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 mb-1">How Escalation Works</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                  Because you are a new user, your reports require community verification. Once a report reaches <strong className="text-blue-600">25 upvotes</strong> from other citizens, it is automatically escalated and dispatched to City contractors. Build your Trust Score to bypass this limit!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Leaderboard */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> My Impact
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Issues Reported</span>
                <span className="font-black text-slate-800">{stats.issuesReported}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Resolved by City</span>
                <span className="font-black text-emerald-600">{stats.resolved}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">False Reports</span>
                <span className={`font-black ${isSuspended ? 'text-red-600' : 'text-slate-800'}`}>{stats.falseReports}/5</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-600">Trust Points</span>
                <span className="font-black text-blue-600">{stats.trustPoints} XP</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                🏆 Top Citizens
              </h3>
            </div>

            <div className="space-y-3">
              {topCitizens.map((usr, i) => {
                const rank = i + 1;
                const isYou = usr.id === user?.id;
                
                return (
                  <div key={usr.id} className={`flex items-center justify-between p-3 rounded-2xl border ${isYou ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${rank <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                        #{rank}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{usr.full_name || 'Citizen'} {isYou && <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded ml-1">YOU</span>}</h4>
                        <p className="text-[9px] text-slate-500 font-semibold">{usr.role === 'citizen' ? 'Citizen' : usr.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-800">{usr.trust_points || 0} <span className="text-[8px] text-slate-400">PTS</span></div>
                    </div>
                  </div>
                );
              })}
              
              {/* Ensure current user is shown at the bottom if not in top 3 */}
              {!topCitizens.find(u => u.id === user?.id) && user?.id && (
                <div className="flex items-center justify-between p-3 rounded-2xl border bg-blue-50 border-blue-200 shadow-sm mt-4 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-200">
                    Your Rank
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-slate-200 text-slate-600">
                      #--
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{user?.full_name || 'You'} <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded ml-1">YOU</span></h4>
                      <p className="text-[9px] text-slate-500 font-semibold">{stats.issuesReported} Reports</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">{stats.trustPoints} <span className="text-[8px] text-slate-400">PTS</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
