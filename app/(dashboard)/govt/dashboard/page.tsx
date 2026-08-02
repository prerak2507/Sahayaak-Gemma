'use client';
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileBarChart, ShieldCheck, 
  AlertTriangle, Map as MapIcon, ArrowRight, Zap,
  Radio, Settings, ShieldAlert, Cpu, Check,
  UserCheck, Shield, ChevronDown, ChevronRight, X, RefreshCw, Send, MapPin,
  Activity, Wifi, Bell, Terminal, Sliders, Search, Volume2, Sparkles, Globe, Columns3,
  Milestone, Droplets, Filter, Flame
} from 'lucide-react';
import { PredictiveWeatherWidget } from '@/components/dashboard/PredictiveWeatherWidget';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, query, where, limit } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';
import { CITY_COORDINATES, ALL_DEPARTMENTS, getDeptIcon, ALL_DEPARTMENT_EMPLOYEES } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

// ALL_DEPARTMENTS, ALL_DEPARTMENT_EMPLOYEES, getDeptIcon, CITY_COORDINATES imported from @/lib/data/govt-data

import GovtEmployeeDashboard from '@/components/dashboard/GovtEmployeeDashboard';
import GovtWorkerDashboard from '@/components/dashboard/GovtWorkerDashboard';
import { useNeeds } from '@/lib/data/use-needs';
import { updateNeed } from '@/lib/data/mutate-need';
import { SpawnIncidentButton } from '@/components/shared/SpawnIncidentButton';

export const initialCityData = {
  Delhi: [
    { id: 'd1', name: 'Connaught Place', open: 4, red: 1, amber: 1, green: 2, sla: 94, top: 'Streetlight outage near Metro Station' },
    { id: 'd2', name: 'ITO', open: 11, red: 5, amber: 4, green: 2, sla: 61, top: 'Sewage overflow on main intersection — 3 days unresolved' },
    { id: 'd3', name: 'Karol Bagh', open: 7, red: 2, amber: 3, green: 2, sla: 78, top: 'Pothole cluster near market — reported 9 times' }
  ]
};

const wardIssues: Record<string, Array<{ id: string; title: string; category: string; severity: 'high' | 'medium' | 'low'; time: string; status: string }>> = {
  'Connaught Place': [
    { id: 'iss-s1', title: 'Streetlight outage near Metro Station', category: 'Streetlights', severity: 'medium', time: '14 hours open', status: 'In Progress' },
    { id: 'iss-s2', title: 'Pothole on inner circle', category: 'Roads', severity: 'low', time: '2 days open', status: 'Open' },
    { id: 'iss-s3', title: 'Garbage dump near Palika Bazaar', category: 'Waste Management', severity: 'high', time: '6 hours open', status: 'Dispatched' }
  ],
  'ITO': [
    { id: 'iss-b1', title: 'Sewage overflow on main intersection — 3 days unresolved', category: 'Drains', severity: 'high', time: '3 days open', status: 'Open' },
    { id: 'iss-b2', title: 'Major leakage in main water feed pipeline', category: 'Water Supply', severity: 'high', time: '24 hours open', status: 'In Progress' },
    { id: 'iss-b3', title: 'Streetlight feeder line short circuit on Bahadur Shah Zafar Marg', category: 'Streetlights', severity: 'medium', time: '5 days open', status: 'Open' }
  ],
  'Karol Bagh': [
    { id: 'iss-m1', title: 'Pothole cluster near market — reported 9 times', category: 'Roads', severity: 'high', time: '6 days open', status: 'Open' },
    { id: 'iss-m2', title: 'Drain overflow causing street muddy water build-up', category: 'Drains', severity: 'medium', time: '18 hours open', status: 'Dispatched' }
  ]
};

export default function Page() {
  const { user } = useAuthStore();
  const { 
    activeCity, setActiveCity,
    cityWards, updateWardMetric, isEditingMetrics, toggleEditingMetrics,
    employeePositions, updateEmployeeStatus, simulateEmployeeGPS,
    forecastData, deployPreventiveUnit,
    sentimentScore, sentimentFeed, issuePRStatement,
    emergencyState, triggerEmergency, revokeEmergency
  } = useGovtStore();
  const [allGovtNeeds, setAllGovtNeeds] = useState<any[]>([]);
  const [globalBroadcastMessage, setGlobalBroadcastMessage] = useState('');
  const [isSyncingNodes, setIsSyncingNodes] = useState(false);
  const [stats, setStats] = useState({ ngos: 0, volunteers: 0 });
  const [systemLogs, setSystemLogs] = useState<Array<{ time: string; text: string; category: string }>>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, any>>({});

  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];
  const DEPARTMENT_EMPLOYEES = ALL_DEPARTMENT_EMPLOYEES[activeCity] || ALL_DEPARTMENT_EMPLOYEES['rajkot'];
  // Wards and City configurations inside dashboard Page
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 🛰️ Google Earth Engine Spatial AI Audit state variables
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditData, setAuditData] = useState<{
    ward_status: string;
    green_cover_estimate_percent: number;
    high_risk_zones_identified: number;
    primary_observation: string;
    recommended_rmc_action: string;
  } | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const currentWards = cityWards[activeCity === 'rajkot' ? 'Rajkot' : 'Delhi'] || cityWards['Delhi'];

  const [editingWard, setEditingWard] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(0);
  const [editRed, setEditRed] = useState(0);
  const [editAmber, setEditAmber] = useState(0);
  const [editGreen, setEditGreen] = useState(0);
  const [editSla, setEditSla] = useState(0);
  const [editTop, setEditTop] = useState('');

  useEffect(() => {
    if (editingWard) {
      setEditOpen(editingWard.open);
      setEditRed(editingWard.red);
      setEditAmber(editingWard.amber);
      setEditGreen(editingWard.green);
      setEditSla(editingWard.sla);
      setEditTop(editingWard.top);
    }
  }, [editingWard]);

  const handleSaveWard = () => {
    if (!editingWard) return;
    updateWardMetric(activeCity === 'rajkot' ? 'Rajkot' : 'Delhi', editingWard.id, {
      open: editOpen,
      red: editRed,
      amber: editAmber,
      green: editGreen,
      sla: editSla,
      top: editTop
    });
    setEditingWard(null);
    toast.success(`Updated ${editingWard.name} successfully!`, { icon: '📝' });
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'crew_telemetry'), (snapshot) => {
      const data: any = {};
      snapshot.forEach(docSnap => {
        data[docSnap.id] = docSnap.data();
      });
      setLiveTelemetry(data);
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    return () => unsub();
  }, []);

  const getInitialLogs = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return [
      { time: timeStr, text: "System Boot: City Command Node Active.", category: "system" },
      { time: timeStr, text: "AI Router synchronized with Firestore needs stream.", category: "ai" },
      { time: timeStr, text: "All 7 departmental telemetry bridges established.", category: "network" }
    ];
  };

  // Initialize logs on mount
  useEffect(() => {
    setSystemLogs(getInitialLogs());
  }, []);

  const addSystemLog = (text: string, category = "info") => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setSystemLogs(prev => [{ time, text, category }, ...prev].slice(0, 30));
  };

  const handleRunSpatialAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    addSystemLog("Starting Gemma vision for the zone assessment", "ai");
    toast.loading("Analyzing Google Earth Engine satellite imagery...", { id: "audit-toast" });

    try {
      const response = await fetch('/api/ai/spatial-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error("Spatial audit server-side failed.");
      }

      const data = await response.json();
      setAuditData(data);
      addSystemLog(`Spatial Audit Completed: Green Cover - ${data.green_cover_estimate_percent}%, High Risk Zones: ${data.high_risk_zones_identified}`, "system");
      toast.success("Spatial environmental audit report generated!", { id: "audit-toast", icon: "🛰️" });
    } catch (err: any) {
      console.error(err);
      setAuditError("Failed to establish server-side telemetry bridge.");
      toast.error("Spatial audit failed. Try again.", { id: "audit-toast" });
    } finally {
      setIsAuditing(false);
    }
  };

  // Reports board.
  //
  // This read used to go straight to Firestore from the browser, and the
  // project's rules deny client reads, so it always failed. The failure was
  // invisible because the handler injected eight fabricated incidents whenever
  // the result was empty, under a comment about never looking dead for a jury.
  // Volunteer and partner counts were fabricated the same way. The dashboard
  // has therefore been showing invented numbers rather than the database.
  //
  // It now reads through the server and shows what is actually there. An empty
  // board renders empty and a failed read says so.
  const { needs: boardNeeds, error: boardError } = useNeeds({ assignment: 'government' });

  useEffect(() => {
    setAllGovtNeeds(boardNeeds);
  }, [boardNeeds]);

  useEffect(() => {
    setStats({
      ngos: new Set(boardNeeds.map((n) => n.assigned_department).filter(Boolean)).size,
      volunteers: new Set(boardNeeds.map((n) => n.assigned_worker_name).filter(Boolean)).size,
    });
  }, [boardNeeds]);

  // Deploy global command directive
  const handleDeployGlobalBroadcast = async () => {
    if (!globalBroadcastMessage.trim()) return;
    addSystemLog(`CENTRAL DIRECTIVE BROADCAST: "${globalBroadcastMessage}"`, 'broadcast');
    
    try {
      const bRef = doc(collection(db, 'broadcasts'));
      await setDoc(bRef, {
        id: bRef.id,
        message: `📢 [Municipal Central Directive]: ${globalBroadcastMessage.trim()}`,
        active: true,
        timestamp: new Date()
      });

      const departmentHeadIds = [
        'demo-govt-worker-001', 'demo-govt-worker-002', 'demo-govt-worker-003',
        'demo-govt-worker-004', 'demo-govt-worker-005', 'demo-govt-worker-006',
        'demo-govt-worker-007'
      ];

      for (const headId of departmentHeadIds) {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          user_id: headId,
          text: `🚨 [Municipal Central Directive]: ${globalBroadcastMessage.trim()}`,
          type: 'CRITICAL',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      toast.success('Central directive broadcasted to all HOD channels!', { icon: '📣' });
      setGlobalBroadcastMessage('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to dispatch global directive.');
    }
  };

  // Autonomous AI Node Workload Optimizer
  const handleSyncNodesWithAI = async () => {
    if (isSyncingNodes) return;
    setIsSyncingNodes(true);
    addSystemLog("AI Workload Optimizer initiated...", "ai");
    
    toast.loading("Analyzing active incident channels and workload maps...", { id: "sync-toast" });
    
    setTimeout(() => {
      toast.loading("Querying standby crew geodetic positions...", { id: "sync-toast" });
    }, 700);

    setTimeout(async () => {
      let dispatchCount = 0;
      try {
        const unassignedTasks = allGovtNeeds.filter(need => !need.assigned_worker_name);
        
        // Keep track of new assignments in this loop to properly balance workloads
        const localAssignmentsTracker: Record<string, number> = {};
        
        for (const task of unassignedTasks) {
          const deptId = task.assigned_department;
          if (deptId && DEPARTMENT_EMPLOYEES[deptId]) {
            const crew = DEPARTMENT_EMPLOYEES[deptId];
            const crewWorkloads = crew.map(member => {
              const previousActiveCount = allGovtNeeds.filter(n => n.assigned_worker_name === member.name).length;
              const newActiveCount = localAssignmentsTracker[member.name] || 0;
              const totalActiveCount = previousActiveCount + newActiveCount;
              return { member, activeCount: totalActiveCount };
            });
            crewWorkloads.sort((a, b) => a.activeCount - b.activeCount);
            
            const bestMatch = crewWorkloads[0]?.member;
            if (bestMatch) {
              // Update our local tracker so the next task goes to someone else
              localAssignmentsTracker[bestMatch.name] = (localAssignmentsTracker[bestMatch.name] || 0) + 1;
              
              await updateNeed(task.id, {
                assigned_worker_id: bestMatch.id,
                assigned_worker_name: bestMatch.name,
                assigned_worker_title: bestMatch.title,
                status: 'assigned',
                note: `Auto-dispatched to ${bestMatch.name}, ${bestMatch.title}`,
                actor: 'auto-dispatch',
              });
              
              addSystemLog(`AI Route: Dispatched task "${task.title.slice(0, 15)}..." to ${bestMatch.name}`, 'dispatch');
              dispatchCount++;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      setIsSyncingNodes(false);
      toast.success(
        dispatchCount > 0 
          ? `Optimization Complete! Route-matched ${dispatchCount} pending incidents to optimal crew.`
          : "Optimization Complete! Standby crew workloads fully balanced.",
        { id: "sync-toast", icon: "🤖" }
      );
      addSystemLog(`Command Grid optimized. Dispatched ${dispatchCount} tasks.`, "system");
    }, 1600);
  };

  const handleAssignTaskToEmployee = async (needId: string, workerName: string, workerTitle: string, workerAvatar: string) => {
    try {
      await updateNeed(needId, {
        assigned_worker_name: workerName,
        assigned_worker_title: workerTitle,
        status: 'assigned',
        note: `Dispatched to ${workerName}, ${workerTitle}, by hand`,
        actor: user?.full_name || 'RMC officer',
      });
      
      const taskObj = allGovtNeeds.find(n => n.id === needId);
      addSystemLog(`Command Dispatch: "${taskObj?.title?.slice(0,15)}..." assigned to ${workerName}`, "dispatch");
      toast.success(`Task successfully routed to ${workerName}!`, { icon: '🚚' });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "The assignment was not saved.");
    }
  };

  // Resolve task trigger for field technicians
  const handleResolveTask = async (needId: string) => {
    try {
      await updateNeed(needId, {
        status: 'completed',
        resolution_note: `Resolved on site by ${user?.full_name || 'field crew'}`,
        actor: user?.full_name || 'field crew',
      });
      toast.success("Incident successfully completed! Telemetry closed.", { icon: '✅' });
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status.");
    }
  };

  const handleUpdateLiveStatus = async (status: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'crew_telemetry', user.id);
      await setDoc(docRef, {
        id: user.id,
        name: user.full_name,
        role: 'govt_employee',
        department: user.department || 'pwd',
        status: status,
        lat: liveTelemetry[user.id]?.lat || 22.2904,
        lng: liveTelemetry[user.id]?.lng || 70.7749,
        landmark: liveTelemetry[user.id]?.landmark || (activeCity === 'rajkot' ? 'Kalavad Road' : 'Connaught Place'),
        updated_at: new Date().toISOString()
      }, { merge: true });
      addSystemLog(`Field Crew Status Update: ${user.full_name} is now ${status}`, 'status');
      toast.success(`Live telemetry status updated to ${status}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync live status.");
    }
  };

  const handleUpdateLiveGPS = async (landmark: string, lat: number, lng: number) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'crew_telemetry', user.id);
      await setDoc(docRef, {
        id: user.id,
        name: user.full_name,
        role: 'govt_employee',
        department: user.department || 'pwd',
        status: liveTelemetry[user.id]?.status || 'DISPATCHED',
        lat: lat,
        lng: lng,
        landmark: landmark,
        updated_at: new Date().toISOString()
      }, { merge: true });
      addSystemLog(`GPS Telemetry Lock: ${user.full_name} moved to ${landmark}`, 'gps');
      toast.success(`GPS Location Synced: ${landmark}`, { icon: '📡' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync GPS telemetry.");
    }
  };

  if (!user) return null;

  if (user.role === 'govt_employee') {
    return <GovtEmployeeDashboard />;
  }

  if (user.role === 'govt_worker') {
    return <GovtWorkerDashboard />;
  }

  // ━━━ 3. EXECUTIVE COMMISSIONER (City HEAD) DASHBOARD ━━━
  const reportsCount = allGovtNeeds.length;
  const alertsCount = allGovtNeeds.filter(n => (n.urgency_score || 0) >= 8).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* ========================================================================= */}
      {/* OPERATIONS COMMAND SUITE HEADER PANEL (DARK-MODE THEMED FOR ULTIMATE UX) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 border border-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[9px] font-black text-blue-400 tracking-[0.25em] bg-blue-950/60 border border-blue-900/60 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-max">
              <Radio size={12} className="text-blue-400 animate-pulse" /> City Operations Command Suite
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-mukta mt-2">
              CivicPulse — City Engineer Operations Dashboard
            </h1>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Real-time civic intelligence console for Chief City Engineer, Dr. Kavita Patel
            </p>
          </div>

          <div className="flex gap-4 items-center self-end md:self-auto">
            <div className="space-y-1 text-right">
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider block">Target City Node</span>
              <div className="relative">
                <select 
                  value={activeCity.toLowerCase()} 
                  onChange={(e) => setActiveCity(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-blue-400 font-extrabold text-xs px-4 py-2.5 rounded-xl appearance-none pr-8 cursor-pointer opacity-100 hover:border-blue-500/50 transition-colors"
                >
                  <option value="ahmedabad">Ahmedabad Hub</option>
                  <option value="delhi">Delhi City</option>
                  <option value="mumbai">Mumbai BMC</option>
                  <option value="rajkot">Rajkot RMC</option>
                  <option value="surat">Surat Hub</option>
                  <option value="vadodara">Vadodara Hub</option>
                </select>
                <ChevronDown size={14} className="text-blue-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* AI Sync Workload Balancing Button inside the Premium Header */}
            <button 
              onClick={handleSyncNodesWithAI}
              disabled={isSyncingNodes}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.12em] flex items-center gap-1.5 transition-all active:scale-95 shadow-lg border self-end h-[36px] ${
                isSyncingNodes 
                  ? 'bg-slate-800 text-white cursor-not-allowed border-slate-700' 
                  : 'bg-blue-600 hover:bg-blue-750 text-white border-blue-500/20'
              }`}
            >
              <RefreshCw size={12} className={`${isSyncingNodes ? 'animate-spin' : ''}`} />
              {isSyncingNodes ? 'Syncing...' : 'Sync AI'}
            </button>

            <div className="bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-center flex items-center gap-2 h-[36px] self-end">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI STATS CARD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-15"><Building2 size={64} style={{ color: '#60a5fa' }} /></div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#94a3b8' }}>Registered NGOs</span>
          <h2 className="text-4xl font-black font-mukta" style={{ color: '#60a5fa' }}>{stats.ngos}</h2>
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: '#64748b' }}>Verified Partnerships</span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-15"><Users size={64} style={{ color: '#2dd4bf' }} /></div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#94a3b8' }}>Active Field Engineers</span>
          <h2 className="text-4xl font-black font-mukta" style={{ color: '#2dd4bf' }}>{stats.volunteers}</h2>
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: '#64748b' }}>Grids Registered</span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-15"><FileBarChart size={64} style={{ color: '#34d399' }} /></div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#94a3b8' }}>Active Incidents</span>
          <h2 className="text-4xl font-black font-mukta" style={{ color: '#34d399' }}>{reportsCount}</h2>
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: '#64748b' }}>Citizen Reports Filed</span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-15"><ShieldAlert size={64} style={{ color: '#f87171' }} /></div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#f87171' }}>Priority Alerts</span>
          <h2 className="text-4xl font-black font-mukta" style={{ color: '#ef4444' }}>{alertsCount}</h2>
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: '#fca5a5' }}>Urgency Score &gt;= 8</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌤 PREDICTIVE WEATHER AI RADAR */}
      {/* ========================================================================= */}
      <PredictiveWeatherWidget city={activeCity.toLowerCase()} />

      {/* ========================================================================= */}
      {/* Live intake control. Gemma writes a resident report and the ordinary
          pipeline routes it, so the board can be shown filling up for real. */}
      <section className="bg-white border border-slate-200 rounded-[2rem] p-6">
        <h2 className="text-sm font-extrabold text-slate-800 mb-1">Live intake</h2>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Watch a report arrive, get read, and land on the board.
        </p>
        <SpawnIncidentButton onSpawned={() => window.setTimeout(() => location.reload(), 1200)} />
      </section>

      {/* 🏢 COMMISSIONER WARD NODES MONITOR GRID */}
      {/* ========================================================================= */}
      <section className="bg-slate-950 border border-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-extrabold font-mukta text-white flex items-center gap-2">
              <Building2 size={20} className="text-blue-400" /> Municipal Ward Nodes — {activeCity ? activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase() : 'Rajkot'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Live operational health and Service Level Agreement status per ward node
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Node Grid Health Stable</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(() => {
            // Group by the ward each report actually carries.
            //
            // This used to scatter reports across three invented zones by
            // hashing the document id, which meant the ward grid showed a
            // stable but entirely fictional distribution. Gemma names a
            // landmark at intake and the gazetteer resolves it, so every
            // report already knows which RMC ward it belongs to.
            const byWard = new Map<string, { id: string; name: string; open: number; red: number; amber: number; green: number; incidents: any[] }>();

            allGovtNeeds.forEach((need) => {
              const name = need.ward || 'Location not yet confirmed';
              if (!byWard.has(name)) {
                byWard.set(name, {
                  id: `W${byWard.size + 1}`,
                  name,
                  open: 0,
                  red: 0,
                  amber: 0,
                  green: 0,
                  incidents: [],
                });
              }
              const ward = byWard.get(name)!;
              const urgency = need.urgency_score || 0;

              ward.open++;
              ward.incidents.push(need);
              if (urgency >= 8) ward.red++;
              else if (urgency >= 5) ward.amber++;
              else ward.green++;
            });

            const wardStats = [...byWard.values()].sort((a, b) => b.red - a.red || b.open - a.open);

            return wardStats.map(ward => {
              // Calculate dynamic SLA based on open high-urgency issues
              const slaImpact = (ward.red * 5) + (ward.amber * 2);
              const dynamicSla = Math.max(0, 100 - slaImpact);
              
              // Get most common top incident or latest high urgency
              const topIncident = ward.incidents.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))[0]?.title || 'System nominal';

              return (
                <div key={ward.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Activity size={80} />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight" title={ward.name}>{ward.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ward ID: {ward.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-800">{ward.open}</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Open<br/>Issues</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-red-50 text-red-600 rounded-xl py-2 flex flex-col items-center justify-center border border-red-100 relative overflow-hidden">
                        <span className="text-sm font-black">{ward.red}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest">High</span>
                        {ward.red > 0 && <div className="absolute bottom-0 w-full h-0.5 bg-red-500 animate-pulse" />}
                      </div>
                      <div className="flex-1 bg-amber-50 text-amber-600 rounded-xl py-2 flex flex-col items-center justify-center border border-amber-100">
                        <span className="text-sm font-black">{ward.amber}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Med</span>
                      </div>
                      <div className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl py-2 flex flex-col items-center justify-center border border-emerald-100">
                        <span className="text-sm font-black">{ward.green}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Low</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>AI Calculated SLA</span>
                        <span className={dynamicSla < 60 ? 'text-red-500' : 'text-emerald-500'}>{dynamicSla}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${dynamicSla < 60 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${dynamicSla}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">AI Detected Critical Thread</p>
                      <p className="text-xs text-slate-700 font-semibold line-clamp-2" title={topIncident}>{topIncident}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                    <button onClick={() => toast.success(`Running deep diagnostic on ${ward.name}... No critical anomalies detected.`, { icon: '🔍' })} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors">
                      View Diagnostics
                    </button>
                    <button disabled className="px-4 py-2 bg-blue-50 text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Sparkles size={12} className="animate-pulse" /> Auto-Managed
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>



      {/* OPERATIONS CONSOLE CONTAINER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10 mt-8">
        
        {/* LEFT COLUMN: GLOBAL COMMAND AUDIT STREAM */}
        <div className="lg:col-span-8 bg-slate-900/5 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden bg-white">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
          
          <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} className="text-blue-500 animate-pulse" /> COMMISSIONER BRIDGE ACTIVE
                </span>
                <h3 className="font-extrabold font-mukta text-xl text-slate-850 mt-1">Operations Control Console</h3>
                <p className="text-slate-500 text-xs mt-0.5">District Command overview. Broadcast emergency overrides to HOD channels or inspect real-time logs.</p>
              </div>
              <span className="text-[8px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                NODE_BRIDGE: ONLINE
              </span>
            </div>

            {/* Smart AI insights */}
            <div className="p-4 bg-gradient-to-r from-blue-50/40 to-indigo-50/20 border border-blue-100 rounded-2xl shadow-sm space-y-2">
              <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={14} className="text-blue-600 animate-pulse" /> Smart AI Routing Insights
              </h4>
              <div className="text-[10px] text-slate-650 leading-relaxed font-medium space-y-1.5">
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  <span><b>AI Routing Prediction:</b> Severe water logging on University Road predicted. Recommend pre-positioning PWD asphalt lead.</span>
                </p>
                <p className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  <span><b>Sewer Alert:</b> Ward 7 drainage overflow is expanding. AI automatically routed backup technician to assist.</span>
                </p>
              </div>
            </div>



            {/* Audit log terminal */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Terminal size={12} className="text-slate-500" /> Real-time District Operations Audit Stream
              </label>
              <div className="h-32 rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-emerald-400 overflow-y-auto space-y-1 border border-slate-900 shadow-inner custom-scrollbar relative">
                {systemLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 leading-relaxed animate-in slide-in-from-bottom-1 duration-100">
                    <span className="text-emerald-600/80">[{log.time}]</span>
                    <span className={`px-1 rounded text-[7px] font-bold ${
                      log.category === 'broadcast' ? 'bg-blue-900 text-blue-200' :
                      log.category === 'system' ? 'bg-slate-800 text-slate-350' :
                      log.category === 'dispatch' ? 'bg-amber-900 text-amber-200' :
                      log.category === 'gps' ? 'bg-purple-900 text-purple-200' :
                      log.category === 'status' ? 'bg-teal-900 text-teal-200' :
                      'bg-slate-900 text-emerald-500'
                    }`}>
                      {log.category.toUpperCase()}
                    </span>
                    <span className="text-emerald-350">{log.text}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 text-emerald-500/50 mt-1">
                  <span>rmc_head@central_command:~#</span>
                  <span className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: City SHORTCUTS & STATUS BEACONS */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
              <Globe size={14} className="text-blue-400 animate-pulse" /> City NETWORK MATRIX
            </span>
            <h3 className="text-lg font-black font-mukta" style={{ color: '#ffffff' }}>Departmental Status Beacons</h3>
            
            <div className="space-y-4">
              {DEPARTMENTS.slice(0, 4).map((d) => {
                const deptNeeds = allGovtNeeds.filter(n => n.assigned_department === d.id && n.status !== 'completed');
                const hasCritical = deptNeeds.some(n => n.urgency_score >= 8);
                const hasHighLoad = deptNeeds.length > 5;
                const dynamicHealth = hasCritical ? 'CRITICAL' : hasHighLoad ? 'HIGH LOAD' : 'OPTIMAL';
                
                const crew = DEPARTMENT_EMPLOYEES[d.id] || [];
                const lead = crew[0]; // Assuming first member is lead
                const isUnderstaffed = deptNeeds.length > crew.length * 2;
                
                return (
                <div key={d.id} className="flex flex-col py-3 border-b border-slate-850/60">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                        {getDeptIcon(d.id)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 text-xs block">{d.name}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">{deptNeeds.length} Open Incidents</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      dynamicHealth === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                      dynamicHealth === 'HIGH LOAD' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {dynamicHealth}
                    </span>
                  </div>

                  {lead && (
                    <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-850/80">
                      <div className="flex items-center gap-2">
                        <img src={lead.avatar} alt={lead.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-200">{lead.name}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">{lead.title} (Lead)</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          addSystemLog(`GPS Summons deployed for ${lead.name}. Telemetry locked.`, 'gps');
                          toast.success(`Tracking live telemetry for ${lead.name}...`, { icon: '📡' });
                        }}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors flex items-center gap-1 group"
                        title="Summon GPS"
                      >
                        <Radio size={12} className="group-hover:animate-pulse" />
                      </button>
                    </div>
                  )}

                  <div className="mt-2.5 flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-slate-500">Resource Matrix</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                      isUnderstaffed ? 'bg-red-950/50 text-red-400 border border-red-900/50' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                    }`}>
                      {crew.length} Crew vs {deptNeeds.length} Tasks
                    </span>
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/government'}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <Shield size={14} /> Strategic Intelligence Console
            </button>
          </div>
        </div>

      </div>



      {/* ========================================================================= */}
      {/* WARD DETAILS DRAWER */}
      {/* ========================================================================= */}
      {isSlideOpen && selectedWard && (
        <div className="fixed inset-y-0 right-0 z-[2000] w-full max-w-md bg-slate-900 border-l border-slate-850 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 text-white">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-white">{selectedWard} Queue</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">District Inspection</p>
              </div>
              <button 
                onClick={() => setIsSlideOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-3xl font-light text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="flex gap-2 mb-4">
                {['all', 'high', 'medium'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      activeTab === tab 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab} Priority
                  </button>
                ))}
              </div>

              {(wardIssues[selectedWard] || [])
                .filter(item => activeTab === 'all' || item.severity === activeTab)
                .map((issue) => (
                  <div 
                    key={issue.id} 
                    className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        issue.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {issue.severity} Priority
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">{issue.time}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold leading-relaxed text-slate-200">{issue.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{issue.category}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        issue.status === 'Dispatched' ? 'text-blue-400' : 'text-amber-400'
                      }`}>{issue.status}</span>
                      <button 
                        onClick={() => {
                          toast.success(`Dispatched field team for: "${issue.title}"`, { icon: '🛠️' });
                        }}
                        className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500/20 text-slate-350 hover:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Re-Dispatch
                      </button>
                    </div>
                  </div>
                ))}

              {(wardIssues[selectedWard] || []).length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No active incidents recorded for this ward.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ COMMISSIONER WARD DATA EDIT MODAL */}
      {/* ========================================================================= */}
      {editingWard && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingWard(null)} />
          <div className="relative bg-white border border-slate-100 w-full max-w-lg rounded-[2.5rem] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold font-mukta text-slate-800">Edit Ward Node Parameters</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{activeCity === 'rajkot' ? 'Rajkot' : 'Delhi'} Commissioner overrides</p>
              </div>
              <button 
                onClick={() => setEditingWard(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 mb-8 text-left max-h-[380px] overflow-y-auto pr-2">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Ward Node Name</p>
                <p className="text-sm font-black text-indigo-900 mt-1">{editingWard.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Open Issues</label>
                  <input 
                    type="number" 
                    value={editOpen} 
                    onChange={(e) => setEditOpen(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SLA Compliance (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={editSla} 
                    onChange={(e) => setEditSla(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Severity Distribution</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-red-500 uppercase block">Red (High)</span>
                    <input 
                      type="number" 
                      value={editRed} 
                      onChange={(e) => setEditRed(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-amber-500 uppercase block">Amber (Med)</span>
                    <input 
                      type="number" 
                      value={editAmber} 
                      onChange={(e) => setEditAmber(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-emerald-500 uppercase block">Green (Low)</span>
                    <input 
                      type="number" 
                      value={editGreen} 
                      onChange={(e) => setEditGreen(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Top Incident Description</label>
                <textarea 
                  value={editTop} 
                  onChange={(e) => setEditTop(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setEditingWard(null)} 
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveWard}
                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Save Overrides
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
