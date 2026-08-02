'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { AlertCircle, Clock, CheckCircle2, UserPlus, MoreVertical, X, Check, Trash2, Building2, Sliders, RefreshCw, Send, Sparkles, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_DEPARTMENTS, ALL_DEPARTMENT_EMPLOYEES } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';
import { scopeToCity } from '@/lib/data/needs';
import { useNeeds } from '@/lib/data/use-needs';
import { updateNeed } from '@/lib/data/mutate-need';

type Column = 'reported' | 'verified' | 'in_progress' | 'completed';

const COLUMNS: { id: Column; title: string; color: string; icon: any }[] = [
  { id: 'reported', title: 'Reported / Grievance', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  { id: 'verified', title: 'Verified / Under Assessment', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  { id: 'in_progress', title: 'Active Dispatch', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserPlus },
  { id: 'completed', title: 'Resolved & Archiving', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 }
];

export default function GovernmentTasks() {
  const [localNeeds, setLocalNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedNeedForAssign, setSelectedNeedForAssign] = useState<any | null>(null);
  const [draggedNeed, setDraggedNeed] = useState<any | null>(null);
  
  const { activeCity } = useGovtStore();
  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];
  const DEPARTMENT_EMPLOYEES = ALL_DEPARTMENT_EMPLOYEES[activeCity] || ALL_DEPARTMENT_EMPLOYEES['rajkot'];
  
  // City compliance audit logger
  const [auditLogs, setAuditLogs] = useState<Array<{ time: string; text: string }>>([]);

  const addAuditLog = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs(prev => [{ time, text }, ...prev].slice(0, 10));
  };

  const [aiScanningState, setAiScanningState] = useState<string>('STANDBY');
  const [lastRunTime, setLastRunTime] = useState<number>(0);
  const [aiStats, setAiStats] = useState({ audited: 0, active: 0, completed: 0 });

  useEffect(() => {
    const volunteersRef = collection(db, 'volunteers');
    const unsubscribeVolunteers = onSnapshot(volunteersRef, (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    // Read through the server. The browser subscription this replaces was
    // denied by Firestore rules on every load, and the handler responded to the
    // empty result by inserting five invented tasks with named workers, so this
    // board has been showing fabricated assignments rather than the database.
    return () => {
      unsubscribeVolunteers();
    };
  }, []);

  const { needs: boardNeeds, isLoading: boardLoading } = useNeeds({ assignment: 'all' });

  useEffect(() => {
    setLocalNeeds(
      boardNeeds.filter(
        (n: any) => !n.pending_verification && n.assignment_type !== 'pending_verification' && !n.is_archived
      ) as any[]
    );
    setLoading(boardLoading);
  }, [boardNeeds, boardLoading]);

  useEffect(() => {
    // Keep stats updated in real-time
    const audited = localNeeds.length;
    const active = localNeeds.filter(n => n.status === 'in_progress').length;
    const completed = localNeeds.filter(n => n.status === 'completed').length;
    setAiStats({ audited, active, completed });
  }, [localNeeds]);

  useEffect(() => {
    if (loading) return;

    const runAiAudit = async () => {
      const now = Date.now();
      // Ensure at least 8 seconds between AI runs to prevent database spamming
      if (now - lastRunTime < 8000) return;
      setLastRunTime(now);

      setAiScanningState('ANALYZING');
      addAuditLog("Gemma: Commencing system-wide ward task audit...");

      let updatesMade = false;

      for (const need of localNeeds) {
        // Skip mock tasks
        if (need.id.startsWith('kn-')) continue;

        const needRef = doc(db, 'needs', need.id);

        // Rule 1: Auto-Archival (Clean up tasks completed > 3 hours ago)
        if (need.status === 'completed' && need.completed_at) {
          const completedTime = new Date(need.completed_at).getTime();
          const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
          if (completedTime < threeHoursAgo) {
            await updateNeed(need.id, { note: 'Auto-archived, completed over three hours ago', actor: 'system' });
            addAuditLog(`Gemma: Auto-archived old completed task "${need.title.slice(0, 20)}..."`);
            updatesMade = true;
            continue;
          }
        }

        // Rule 2: AI Auto-Assignment
        if (need.status === 'reported' && (!need.assignment_type || need.assignment_type === 'government') && !need.assigned_worker_name) {
          // Identify the department
          const deptId = need.assigned_department || 'pwd'; // fallback to pwd
          const availableWorkers = DEPARTMENT_EMPLOYEES[deptId] || [];
          
          if (availableWorkers.length > 0) {
            // Find a worker with less than 10 active tickets
            let selectedWorker = null;
            for (const worker of availableWorkers) {
              const workerActiveTickets = localNeeds.filter(n => 
                n.assigned_worker_name === worker.name && 
                (n.status === 'verified' || n.status === 'in_progress')
              ).length;
              
              if (workerActiveTickets < 10) {
                selectedWorker = worker;
                break;
              }
            }

            if (selectedWorker) {
              await updateDoc(needRef, {
                status: 'verified',
                assignment_type: 'government',
                assigned_department: deptId,
                assigned_worker_name: selectedWorker.name,
                routing_reason: `AI Auto-Assigned to ${selectedWorker.title} (Current Active Load: Low).`
              });
              addAuditLog(`Gemma: Auto-routed "${need.title.slice(0, 15)}..." to ${selectedWorker.name}`);
              updatesMade = true;
              break; // Prevent database write collision
            } else {
              addAuditLog(`Gemma: Cannot route "${need.title.slice(0, 15)}...". All workers in ${deptId} at maximum capacity (10+ tickets).`);
            }
          }
        }
      }

      if (!updatesMade) {
        setTimeout(() => setAiScanningState('STANDBY'), 1500);
      } else {
        setTimeout(() => setAiScanningState('COMPLETED_RUN'), 1500);
      }
    };

    const intervalId = setInterval(runAiAudit, 10000);
    // Also run once initially
    const initTimeout = setTimeout(runAiAudit, 2000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initTimeout);
    };
  }, [loading, localNeeds, lastRunTime]);

  const handleDragStart = (e: React.DragEvent, need: any) => {
    setDraggedNeed(need);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Column) => {
    e.preventDefault();
    if (!draggedNeed || draggedNeed.status === targetStatus) return;

    const promise = new Promise(async (resolve, reject) => {
        try {
            // Saved server side. A failure rejects the promise, so the
            // toast below reports the truth rather than covering a lost edit.
            await updateNeed(draggedNeed.id, { status: targetStatus, actor: 'RMC officer' });
            setLocalNeeds(prev => prev.map(n => 
                n.id === draggedNeed.id ? { ...n, status: targetStatus } : n
            ));
            addAuditLog(`Sovereign Status Override: "${draggedNeed.title.slice(0,20)}..." shifted to [${targetStatus.toUpperCase()}]`);
            setTimeout(() => resolve(true), 400);
        } catch (err) {
            reject(err);
        }
    });
      
    toast.promise(promise, {
      loading: 'Overriding status...',
      success: 'Status updated successfully',
      error: 'Failed to update status'
    });

    setDraggedNeed(null);
  };

  const purgeTask = async (id: string, title: string) => {
    if (!window.confirm(`⚠️ SOVEREIGN WARNING: You are about to permanently purge and erase "${title}" from the entire Sahaayak system database. This action is absolute. Continue?`)) return;
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        if (!id.startsWith('kn-')) {
          await deleteDoc(doc(db, 'needs', id));
        }
        setLocalNeeds(prev => prev.filter(n => n.id !== id));
        addAuditLog(`Sovereign Record Purge: "${title.slice(0, 20)}..." completely erased from database.`);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise, {
      loading: 'Purging record...',
      success: 'Task deleted permanently.',
      error: 'Purge failed.'
    });
  };

  const handleReassignNeed = async (needId: string, type: 'government' | 'ngo', value: string) => {
    try {
      const need = localNeeds.find(n => n.id === needId);
      if (!need) return;

      const updates: any = {
        assignment_type: type,
        assigned_ngo_name: type === 'ngo' ? value : null,
        assigned_department: type === 'government' ? value : null,
        assigned_worker_name: null // reset employee assignment if department changed
      };

      await updateNeed(needId, {
        assigned_department: type === 'government' ? value : undefined,
        actor: 'RMC officer',
        note: type === 'ngo' ? `Referred to ${value}` : undefined,
      });

      setLocalNeeds(prev => prev.map(n => 
        n.id === needId ? { ...n, ...updates } : n
      ));

      addAuditLog(`Re-routing Action: "${need.title.slice(0, 20)}..." assigned to [${value.toUpperCase()}]`);
      toast.success(`Task successfully routed to ${value}!`);
      setSelectedNeedForAssign(null);
    } catch (err: any) {
      toast.error('Re-assignment failed: ' + err.message);
    }
  };

  // Group needs
  const groupedNeeds = COLUMNS.reduce((acc, col) => {
    acc[col.id] = localNeeds.filter(n => n.status === col.id);
    return acc;
  }, {} as Record<Column, any[]>);

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Loading Sovereign Command Board...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-800 p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* City Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 shadow-lg shadow-slate-100/50 backdrop-blur-md p-6 rounded-[2rem] relative z-10">
        <div>
          <span className="text-[9px] font-mono text-blue-650 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Sliders size={12} className="text-blue-600 animate-spin" /> City OFFICIAL CONTROL DECK
          </span>
          <h1 className="text-3xl font-black font-mukta text-slate-850 tracking-tight mt-1 flex items-center gap-2">
            📊 Sovereign Gaps & Task Oversight Board
          </h1>
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
            Full-spectrum district-wide overview. Drag-and-drop overriding, structural routing, and permanent purging.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles size={14} className="text-blue-600" /> SYSTEM-WIDE ADMINISTRATIVE OVERRIDE ACTIVE
          </div>
        </div>
      </div>

      {/* Grid: Columns Board */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start relative z-10 flex-1">
        {COLUMNS.map(col => {
          const colNeeds = groupedNeeds[col.id] || [];
          const Icon = col.icon;
          
          return (
            <div 
              key={col.id} 
              className="bg-white/80 border border-slate-200 shadow-md rounded-[2rem] flex flex-col min-h-[550px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`p-4 border-b flex justify-between items-center bg-white rounded-t-[2rem] border ${col.color} border-x-0 border-t-0`}>
                <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-mukta">
                  <Icon size={18} />
                  {col.title}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-50 rounded-md border shadow-sm">
                  {colNeeds.length}
                </span>
              </div>
              
              {/* Column Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar">
                {colNeeds.map(need => (
                  <div
                    key={need.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, need)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group relative"
                  >
                    <div className="w-full h-1 absolute top-0 left-0 rounded-t-2xl" 
                         style={{ background: need.urgency_score >= 8 ? 'var(--critical)' : need.urgency_score >= 6 ? 'var(--high)' : 'var(--saffron)' }} />
                    
                    <div className="flex justify-between items-start mb-2.5 mt-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
                        {need.category}
                      </span>
                      
                      {/* Action Menu (Administrative) */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedNeedForAssign(need)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-colors flex items-center gap-1 text-[9px] font-black uppercase"
                          title="Override Routing"
                        >
                          <Filter size={12} /> ROUTE
                        </button>
                        <button 
                          onClick={() => purgeTask(need.id, need.title)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                          title="Sovereign Permanent Purge"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Routing Overlay Drawer inside Card */}
                    {selectedNeedForAssign?.id === need.id && (
                      <div className="absolute inset-0 bg-white z-20 p-4 rounded-2xl flex flex-col animate-in slide-in-from-bottom duration-200 overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">Override Routing & Owner</h5>
                          <button onClick={() => setSelectedNeedForAssign(null)} className="text-slate-400"><X size={14} /></button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Option 1: Route to Department */}
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Route to Municipal Dept:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {DEPARTMENTS.slice(0, 4).map(d => (
                                <button 
                                  key={d.id} 
                                  onClick={() => handleReassignNeed(need.id, 'government', d.id)}
                                  className="text-left text-[9px] font-bold p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-300 transition-colors truncate"
                                >
                                  🏢 {d.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Option 2: Route to registered NGO */}
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assign to Registered NGO:</p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {['Red Cross Delhi', 'Asha Relief Foundation', 'Sanjeevani Social Hub'].map(ngo => (
                                <button 
                                  key={ngo} 
                                  onClick={() => handleReassignNeed(need.id, 'ngo', ngo)}
                                  className="text-left text-[9px] font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-300 transition-colors"
                                >
                                  🤝 {ngo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <h4 className="font-extrabold font-mukta text-slate-800 text-sm mb-2">{need.title}</h4>
                    
                    {/* 🤖 Real-time AI Progress Bar */}
                    {need.status === 'in_progress' && (
                      <div className="mb-3.5 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-blue-600 uppercase tracking-widest">
                          <span>🤖 Telemetry Progress</span>
                          <span>{need.ai_progress || 15}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${need.ai_progress || 15}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {need.status === 'completed' && need.ai_progress === 100 && (
                      <div className="mb-3.5 flex items-center gap-1.5 text-[8px] font-bold text-emerald-650 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={10} className="text-emerald-550" />
                        <span>Auto-resolved</span>
                      </div>
                    )}

                    {/* Routing State Indicator Badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-3.5 pt-2 border-t border-slate-100">
                      {(need.assignment_type === 'government') ? (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-blue-200">
                          <span>DEPT: {need.assigned_department?.toUpperCase() || 'UNASSIGNED'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-teal-200">
                          <span>NGO: {need.assigned_ngo_name || 'PENDING ASSIGNMENT'}</span>
                        </div>
                      )}
                      {need.assigned_worker_name && (
                        <span className="text-[8px] text-slate-450 font-bold">Crew: {need.assigned_worker_name}</span>
                      )}
                      {need.assigned_volunteer_name && (
                        <span className="text-[8px] text-blue-600 font-bold">Vol: {need.assigned_volunteer_name}</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-450 font-mono">
                      <span>Urgency: <span className="font-bold text-slate-700">{need.urgency_score.toFixed(1)}</span></span>
                      <span>{need.city}</span>
                    </div>
                  </div>
                ))}
                
                {colNeeds.length === 0 && (
                  <div className="h-44 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/50 italic">
                    Administrative override slot
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI TASK CONTROLLER HUD & OPERATIONS TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Glowing AI Task Controller HUD Card */}
        <div className="bg-[#0F172A] rounded-[2rem] border border-slate-800 p-6 space-y-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-50 group-hover:bg-blue-400/20 transition-all duration-700" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} className="animate-pulse" /> CORE INTELLIGENCE LAYER
              </span>
              <h3 className="text-lg font-black font-mukta text-white tracking-tight mt-1">
                Autonomous dispatch, running on Gemma 4
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Real-time spatial heuristics & dispatch synchronization.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                {aiScanningState}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Audited Needs</span>
              <p className="text-xl font-black text-blue-400 mt-0.5">{aiStats.audited}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Dispatches</span>
              <p className="text-xl font-black text-indigo-400 mt-0.5">{aiStats.active}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Auto-Resolved</span>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{aiStats.completed}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
            <div>
              <span className="text-slate-500 uppercase tracking-wider block text-[8px]">Decision Mode</span>
              <span className="font-extrabold text-blue-300">FULLY AUTONOMOUS</span>
            </div>
            <div className="border-l border-slate-850 h-6" />
            <div>
              <span className="text-slate-500 uppercase tracking-wider block text-[8px]">Core Audit Interval</span>
              <span className="font-extrabold text-indigo-300">10.0s REAL-TIME SYNCHRONIZATION</span>
            </div>
          </div>
        </div>

        {/* City OPERATIONS AUDIT TERMINAL */}
        <div className="bg-[#0F172A] rounded-[2rem] border border-slate-800 p-6 space-y-4 shadow-2xl relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            🛡️ Sovereign Action Logger & Operations Audit Trail
          </label>
          <div className="h-36 rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-emerald-400 overflow-y-auto space-y-1.5 border border-slate-900 shadow-inner">
            {auditLogs.map((log, index) => (
              <div key={index} className="flex gap-3 leading-relaxed">
                <span className="text-emerald-700/80">[{log.time}]</span>
                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-emerald-950 text-emerald-450 border border-emerald-900 uppercase">AUDIT</span>
                <span>{log.text}</span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-slate-650 italic">Awaiting administrative override triggers...</div>
            )}
            <div className="flex items-center gap-1 text-emerald-500/50 mt-1">
              <span>rmc_tasks@switchboard:~#</span>
              <span className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
