'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, AlertCircle, ThumbsUp, Flame, Skull, TrendingUp, CheckCircle2, Clock
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CommunityReportsPage() {
  const { user } = useAuthStore();
  const [communityIssues, setCommunityIssues] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ falseReports: user?.false_reports_count || 0 });

  useEffect(() => {
    if (!user?.id) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({ falseReports: data.false_reports_count ?? 0 });
      }
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    const qComm = query(
      collection(db, 'needs'), 
      where('city', '==', 'New Delhi'),
      orderBy('created_at', 'desc')
    );
    
    const unsubComm = onSnapshot(qComm, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Filter out user's own reports on the client
      setCommunityIssues(issues.filter(i => i.reported_by !== user.id));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => { unsubUser(); unsubComm(); };
  }, [user?.id]);

  const handleUpvote = async (issue: any) => {
    if (!user?.id) return;
    if (issue.upvoted_by?.includes(user.id) || issue.downvoted_by?.includes(user.id)) {
      toast.error("You have already voted on this report.");
      return;
    }
    if (stats.falseReports >= 5) {
      toast.error("Your account is suspended from voting due to false reports.");
      return;
    }

    setIsProcessing(true);
    try {
      const issueRef = doc(db, 'needs', issue.id);
      const newUpvotes = (issue.upvotes || 0) + 1;
      
      await updateDoc(issueRef, {
        upvotes: increment(1),
        upvoted_by: arrayUnion(user.id)
      });

      toast.success("Upvote recorded!");

      if (newUpvotes === 25 && issue.status === 'reported') {
        toast('Community Consensus Reached! AI routing task to City...', { icon: '🤖', duration: 4000 });
        try {
          await fetch('/api/ai/autonomous-dispatch', {
            method: 'POST',
            body: JSON.stringify({ needId: issue.id }),
            headers: { 'Content-Type': 'application/json' }
          });
          toast.success(`Task ${issue.id} autonomously dispatched to Field Worker!`);
        } catch (e) {
          console.error("Auto dispatch failed", e);
        }
      }

      await updateDoc(doc(db, 'users', user.id), { trust_points: increment(5) });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upvote.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevAdd25Upvotes = async (issue: any) => {
    setIsProcessing(true);
    try {
      const issueRef = doc(db, 'needs', issue.id);
      await updateDoc(issueRef, { upvotes: 25 });
      toast.success("Simulated 25 upvotes!");
      toast('Community Consensus Reached! AI routing task to City...', { icon: '🤖', duration: 4000 });
      await fetch('/api/ai/autonomous-dispatch', {
        method: 'POST',
        body: JSON.stringify({ needId: issue.id }),
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success(`Task ${issue.id} autonomously dispatched!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevMarkInvalid = async (issue: any) => {
    setIsProcessing(true);
    try {
      if (issue.reported_by) {
        await updateDoc(doc(db, 'users', issue.reported_by), {
          trust_points: increment(-20),
          false_reports_count: increment(1)
        });
        toast.error(`Reporter penalized for invalid issue!`);
      }
      await updateDoc(doc(db, 'needs', issue.id), { status: 'closed', resolution_note: 'Marked invalid by community' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSuspended = stats.falseReports >= 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pt-8 pb-20 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 font-mukta flex items-center gap-2 mb-2">
          <Flame size={28} className="text-orange-500" /> Nearby Community Reports
        </h1>
        <p className="text-slate-500 text-sm">
          Review and verify civic issues reported by other citizens in your area. Your upvotes help determine which issues are escalated to the government.
        </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityIssues.map((issue) => (
          <div key={issue.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg mb-1">{issue.title}</h4>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MapPin size={12} /> {issue.landmark || issue.city || 'Nearby'}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 flex-grow">{issue.description}</p>
            
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-auto">
              <button 
                onClick={() => handleUpvote(issue)}
                disabled={isSuspended || issue.upvoted_by?.includes(user?.id) || isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  issue.upvoted_by?.includes(user?.id) 
                    ? 'bg-blue-100 text-blue-700' 
                    : isSuspended
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <ThumbsUp size={16} /> 
                {issue.upvoted_by?.includes(user?.id) ? 'Upvoted' : 'Verify'} ({issue.upvotes || 0}/25)
              </button>
              
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 py-1 bg-slate-100 rounded-lg">
                {issue.status}
              </span>
            </div>

            {/* Developer Simulation Controls */}
            {issue.status === 'reported' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button 
                  onClick={() => handleDevAdd25Upvotes(issue)}
                  disabled={isProcessing}
                  className="text-[9px] font-black tracking-wider uppercase px-2 py-1 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors w-full"
                >
                  [DEMO] Inject 25 Upvotes
                </button>
                <button 
                  onClick={() => handleDevMarkInvalid(issue)}
                  disabled={isProcessing}
                  className="text-[9px] font-black tracking-wider uppercase px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors w-full"
                >
                  [DEMO] Mark Invalid
                </button>
              </div>
            )}
          </div>
        ))}
        {communityIssues.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Flame size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No nearby community issues found</p>
            <p className="text-xs text-slate-500 mt-1">Check back later for new reports in your area.</p>
          </div>
        )}
      </div>
    </div>
  );
}
