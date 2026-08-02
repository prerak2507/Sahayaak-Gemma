'use client';
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileBarChart, ShieldCheck, 
  AlertTriangle, Map as MapIcon, ArrowRight, Zap,
  Eye, EyeOff, Radio, Settings, ShieldAlert, Cpu, Check,
  Phone, UserCheck, Shield, ChevronDown, RefreshCw, Send, MapPin,
  Activity, Wifi, Bell, Terminal, Sliders, Search, Volume2, Sparkles, Globe, Columns3,
  Milestone, Droplets, Filter, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { ALL_DEPARTMENTS, getDeptIcon, ALL_DEPARTMENT_EMPLOYEES } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';
import { scopeToCity } from '@/lib/data/needs';
import { useNeeds } from '@/lib/data/use-needs';

// ALL_DEPARTMENTS, ALL_DEPARTMENT_EMPLOYEES, getDeptIcon imported from @/lib/data/govt-data

export default function Page() {
  const { user, loginAsDemo } = useAuthStore();
  const [allGovtNeeds, setAllGovtNeeds] = useState<any[]>([]);
  const [activeDeptFilter, setActiveDeptFilter] = useState<string | null>(null);
  const [isAssigningTaskForEmp, setIsAssigningTaskForEmp] = useState<string | null>(null);
  
  const { activeCity, employeePositions, updateEmployeeStatus, simulateEmployeeGPS } = useGovtStore();
  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];
  const DEPARTMENT_EMPLOYEES = ALL_DEPARTMENT_EMPLOYEES[activeCity] || ALL_DEPARTMENT_EMPLOYEES['rajkot'];

  // Custom smart-city telemetry console state
  const [deptBroadcastMessage, setDeptBroadcastMessage] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  
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

  const [systemLogs, setSystemLogs] = useState<Array<{ time: string; text: string; category: string }>>([]);

  // Initialize logs on mount to ensure SSR matches client
  useEffect(() => {
    setSystemLogs(getInitialLogs());
  }, []);

  const addSystemLog = (text: string, category = "info") => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setSystemLogs(prev => [{ time, text, category }, ...prev].slice(0, 30));
  };
  
  // Real-time simulated positions of employee personnel from global store
  const handleUpdateWorkerStatus = (empId: string, newStatus: string) => {
    updateEmployeeStatus(empId, newStatus as any);
    
    // Find employee details for logging
    let foundName = empId;
    Object.values(DEPARTMENT_EMPLOYEES).forEach(arr => {
      const match = arr.find(e => e.id === empId);
      if (match) foundName = match.name;
    });

    addSystemLog(`Personnel Status: [${foundName}] set to ${newStatus}`, "status");
    toast.success(`Worker status updated to: ${newStatus}`);
  };

  const handleSimulatePosition = (empId: string, landmark: string, lat: number, lng: number) => {
    simulateEmployeeGPS(empId, landmark, lat, lng);

    let foundName = empId;
    Object.values(DEPARTMENT_EMPLOYEES).forEach(arr => {
      const match = arr.find(e => e.id === empId);
      if (match) foundName = match.name;
    });

    addSystemLog(`Telemetry Lock: [${foundName}] simulated near ${landmark}`, "gps");
    toast.success(`[${foundName}] GPS Telemetry synced with ${landmark}`, { icon: '📡' });
  };

  // Sync government-categorized needs from Firestore
  const { needs: boardNeeds } = useNeeds({ assignment: 'government' });

  useEffect(() => {
    // Read through the server. Firestore rules deny client reads, so the
    // browser subscription this replaces returned nothing on every load.
    setAllGovtNeeds(boardNeeds);
  }, [boardNeeds]);

  const handleAssignTaskToEmployee = async (needId: string, workerName: string, workerTitle: string) => {
    try {
      const needRef = doc(db, 'needs', needId);
      await updateDoc(needRef, {
        assigned_worker_name: workerName,
        assigned_worker_title: workerTitle,
        routing_reason: `Officially assigned to Senior Technician ${workerName} (${workerTitle}) by City Command Switchboard.`
      });
      
      const taskObj = allGovtNeeds.find(n => n.id === needId);
      addSystemLog(`Dispatch Triggered: "${taskObj?.title?.slice(0,25)}..." assigned to ${workerName}`, "dispatch");
      toast.success(`Task successfully routed to ${workerName}!`, { icon: '🚚' });
      setIsAssigningTaskForEmp(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign task in Firestore.");
    }
  };

  const currentDept = user?.role === 'govt_worker' ? user?.department : null;
  const isDeptWorker = !!currentDept;

  const filteredNeeds = allGovtNeeds.filter((n) => {
    if (currentDept) return n.assigned_department === currentDept;
    if (activeDeptFilter) return n.assigned_department === activeDeptFilter;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-800 p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Background Grid Pattern with Radial Blue Light Glow */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 border border-slate-200/80 shadow-lg shadow-slate-100/50 backdrop-blur-md p-6 rounded-[2rem] relative z-10">
        <div>
          <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Sliders size={12} className="text-blue-600 animate-spin" /> City OFFICIAL CONTROL SWITCHBOARD
          </span>
          <h1 className="text-2xl font-black font-mukta text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            🏢 Smart City Command Switchboard
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Real-time multi-departmental personnel switchboard, telemetry coordinator, and crew dispatcher.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/80 text-blue-600 rounded-xl border border-blue-200/60 text-xs font-bold uppercase tracking-widest shadow-sm">
            <ShieldCheck size={14} /> ACTIVE DISPATCH SESSION
          </div>
        </div>
      </div>

      {/* City Control Deck Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROL DECK CHANNELS ROSTER (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white/80 border border-slate-200/80 shadow-lg shadow-slate-100/50 backdrop-blur-md rounded-[2rem] p-6 flex flex-col justify-between space-y-4 relative z-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h4 className="font-extrabold font-mukta text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Wifi size={16} className="text-emerald-500 animate-pulse" /> City CONTROL DECK
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase border border-emerald-100">
                GRID OK
              </span>
            </div>
            
            <p className="text-[10px] text-slate-450 uppercase tracking-widest font-extrabold">7 UNIFIED RESOURCE CHANNELS</p>
            
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {DEPARTMENTS.map((dept) => {
                const isActive = activeDeptFilter === dept.id;
                const deptAlerts = allGovtNeeds.filter((n) => n.assigned_department === dept.id && n.urgency_score >= 8);
                const activeCount = allGovtNeeds.filter(n => n.assigned_department === dept.id).length;
                
                return (
                  <button
                    key={dept.id}
                    onClick={() => {
                      if (isActive) {
                        setActiveDeptFilter(null);
                        setSelectedEmpId(null);
                        toast.success('Restored Central Command View!', { icon: '🏢' });
                      } else {
                        setActiveDeptFilter(dept.id);
                        setSelectedEmpId(null);
                        toast.success(`Viewing Departmental Node: ${dept.name}`, {
                          icon: '👁️',
                          style: {
                            background: '#f8fafc',
                            color: '#1e293b',
                            border: '1px solid #e2e8f0',
                          }
                        });
                      }
                    }}
                    className={`w-full p-3.5 rounded-2xl border transition-all text-left flex justify-between items-center ${
                      isActive 
                        ? 'bg-blue-50 border-blue-300 shadow-md shadow-blue-500/5' 
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/85 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                        {getDeptIcon(dept.id)}
                      </div>
                      <div>
                        <h5 className={`font-black text-xs leading-none ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                          {dept.name}
                        </h5>
                        <p className="text-[8px] text-slate-450 font-bold uppercase mt-1 tracking-wider">
                          {dept.worker}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono font-bold text-slate-450">
                          ACTIVE: <b className={`${activeCount > 0 ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`}>{activeCount}</b>
                        </span>
                        {deptAlerts.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[7px] font-black text-red-650">
                            🚨 {deptAlerts.length} ALERTS
                          </span>
                        )}
                      </div>
                      
                      {/* Status beacon dot */}
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          dept.health === 'CRITICAL' ? 'bg-red-400' : dept.health === 'HIGH LOAD' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          dept.health === 'CRITICAL' ? 'bg-red-500' : dept.health === 'HIGH LOAD' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick terminal footer */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
              <span>SECURE CONNECTED: MCD_NODE_01</span>
              <span>DB: FIRESTORE LIVE</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMAND MONITOR SCREEN (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white/80 border border-slate-200/80 shadow-lg shadow-slate-100/50 backdrop-blur-md rounded-[2rem] p-6 flex flex-col justify-between space-y-6 relative overflow-hidden text-slate-700 z-10 min-h-[520px]">
          
          {/* Tech grid screen overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
          
          {/* SCREEN CONTENT */}
          {activeDeptFilter === null ? (
            // 🌐 CENTRAL COMMAND HUB MONITOR (Active when no channel is selected)
            <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-300">
              
              {/* Hub Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <Radio size={10} className="text-blue-600 animate-pulse" /> LIVE TELEMETRY BRIDGE ACTIVE
                  </span>
                  <h3 className="font-extrabold font-mukta text-xl text-slate-800 mt-1">Global Command Hub Monitor</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Please select a Department Channel from the left Control Deck roster to manage field technicians, simulate GPS coords, and dispatch municipal tasks.</p>
                </div>
                <span className="text-[8px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md uppercase">
                  SYS_UPTIME: 99.98%
                </span>
              </div>

              {/* Sub-system Health Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Platform Operations', status: 'NOMINAL', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'GIS Live Tracking', status: 'ACTIVE', color: 'text-blue-600 bg-blue-55/60 border-blue-200' },
                  { label: 'NGO Bridge Sync', status: 'STABLE', color: 'text-teal-600 bg-teal-50 border-teal-100' },
                  { label: 'Dispatches Hub', status: 'NOMINAL', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                ].map((sys, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-1.5 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{sys.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${sys.color}`}>
                      {sys.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Resource Dispatch Suggestions Card */}
              <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border border-blue-100 rounded-2xl shadow-sm space-y-2 text-slate-700">
                <h4 className="text-xs font-black text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={14} className="text-blue-650 animate-pulse" /> Smart AI Routing Intelligence
                </h4>
                <div className="text-[10px] text-slate-600 leading-relaxed font-medium space-y-1.5">
                  <p className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span><b>AI Routing Prediction:</b> Severe water logging on University Road predicted. Recommend pre-positioning <b>1 asphalt technician</b> from PWD to Standby nearby.</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span><b>Sewer Alert:</b> Ward 7 drainage overflow is expanding. AI automatically routed backup technician <b>Ramesh Koli (Sanitation)</b> to assist.</span>
                  </p>
                </div>
              </div>

              {/* Audit log Terminal Console */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Terminal size={12} className="text-slate-450" /> Real-time District Operations Audit Stream
                </label>
                <div className="h-44 rounded-2xl bg-slate-900 p-4 font-mono text-[9px] text-emerald-400 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner custom-scrollbar relative">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed animate-in slide-in-from-bottom-1 duration-200">
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
                      <span>{log.text}</span>
                    </div>
                  ))}
                  {systemLogs.length === 0 && (
                    <div className="text-slate-650 italic">Listening for telemetry signals...</div>
                  )}
                  <div className="flex items-center gap-1 text-emerald-500/50 mt-1">
                    <span>rmc_head@central_command:~#</span>
                    <span className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // 🏢 DEPARTMENT OPERATIONS ROOM (Active when a department is selected)
            (() => {
              const dept = DEPARTMENTS.find(d => d.id === activeDeptFilter);
              if (!dept) return null;
              const roster = DEPARTMENT_EMPLOYEES[dept.id] || [];
              
              return (
                <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                  
                  {/* Operations Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[8px] font-mono text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <Activity size={10} className="text-blue-600 animate-pulse" /> FOCUSED TELEMETRY INTERFACE ACTIVE
                      </span>
                      <h3 className="font-extrabold font-mukta text-xl text-slate-800 mt-1 flex items-center gap-2">
                        {getDeptIcon(dept.id)} {dept.name} Operations Room
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Manage personnel status, simulate GPS telemetric locks, and route active reports directly to crews.
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                        <button 
                          onClick={() => {
                            setActiveDeptFilter(null);
                            setSelectedEmpId(null);
                            loginAsDemo('govt_officer');
                            toast.success('Restored Central Command session!', { icon: '🏢' });
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all shadow-sm active:scale-95 border border-slate-200"
                        >
                          Reset to Central Hub
                        </button>
                        
                        {/* Executive Inspection Mode Badge */}
                        <div className="relative px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-blue-200 shadow-sm shadow-blue-100/50">
                          <Eye size={12} className="text-blue-600" /> Executive Inspection Mode
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Half: HOD details & Broadcaster side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    {/* HOD Profile Details */}
                    <div className="md:col-span-5 p-5 bg-slate-55/60 border border-slate-200 rounded-2xl flex flex-col justify-center gap-3.5 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <img src={dept.avatar} alt={dept.worker} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-md" />
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-sm leading-none">{dept.worker}</h5>
                          <p className="text-[9px] text-blue-600 font-black uppercase mt-1.5 tracking-wider">{dept.title}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-150">
                        <span>⏱️ Latency: <b className="text-slate-700">{dept.defaultLatency}</b></span>
                        <span>⚡ Load: <b className="text-slate-700">{dept.health}</b></span>
                      </div>
                    </div>

                    {/* Department voice broadcaster */}
                    <div className="md:col-span-7 p-4 bg-slate-55/60 border border-slate-200 rounded-2xl text-slate-700 space-y-3 shadow-sm flex flex-col justify-between">
                      <span className="text-[8px] font-black text-slate-450 uppercase tracking-[0.2em] flex items-center gap-1">
                        <Radio size={12} className="text-blue-500 animate-pulse" /> Dispatcher Voice Broadcaster (All Active Terminals)
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <textarea
                          value={deptBroadcastMessage}
                          onChange={(e) => setDeptBroadcastMessage(e.target.value)}
                          placeholder={`Broadcast directive to all ${dept.name} active crew terminals...`}
                          rows={2}
                          className="flex-grow px-3 py-2 rounded-xl border border-slate-200 bg-white text-[10px] text-slate-800 focus:ring-1 focus:ring-blue-550 placeholder-slate-350 outline-none resize-none transition-all"
                        />
                        <button 
                          onClick={() => {
                            if (!deptBroadcastMessage.trim()) return;
                            addSystemLog(`[${dept.name.toUpperCase()} CHANNEL BROADCAST]: "${deptBroadcastMessage}"`, 'broadcast');
                            toast.success(`Alert sent to all ${dept.name} active crew terminals!`, { icon: '📣' });
                            setDeptBroadcastMessage('');
                          }}
                          className="sm:w-36 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md shadow-blue-550/10"
                        >
                          <Send size={10} /> Transmit
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Half: Full-Width Spacious Personnel Roster Grid */}
                  <div className="border-t border-slate-200 pt-6 mt-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={16} className="text-slate-500" /> Active Field Personnel & GPS Telemetry Grid ({roster.length})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[8px] font-black text-blue-600 uppercase border border-blue-100 tracking-wider">
                        TELEMETRY COORDINATE LOCKS SYNCED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {roster.map((emp) => {
                        const activeTasks = filteredNeeds.filter(n => n.assigned_worker_name === emp.name);
                        const pos = employeePositions[emp.id] || { lat: 22.3039, lng: 70.8022, landmark: 'Central Station', status: 'STANDBY' };
                        const isAssigning = isAssigningTaskForEmp === emp.id;
                        
                        return (
                          <div key={emp.id} className="p-5 bg-white border border-slate-200 rounded-[1.5rem] flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-slate-700">
                            
                            {/* Employee Head Info Row */}
                            <div className="flex gap-2.5 justify-between items-start">
                              <div className="flex gap-3">
                                <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" />
                                <div>
                                  <h5 className="font-extrabold text-slate-800 text-sm leading-none flex items-center gap-1">
                                    {emp.name}
                                  </h5>
                                  <p className="text-[9px] text-blue-600 font-bold uppercase mt-1 tracking-wider">{emp.title}</p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">{emp.phone}</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border shadow-sm ${
                                pos.status === 'ON LEAVE' ? 'text-red-650 bg-red-50 border-red-150' :
                                pos.status === 'DISPATCHED' ? 'text-blue-600 bg-blue-50 border-blue-150' :
                                'text-slate-500 bg-slate-50 border-slate-200'
                              }`}>
                                {pos.status || emp.defaultStatus}
                              </span>
                            </div>

                            {/* Spacious Stats Matrix Row */}
                            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center text-xs text-slate-600">
                              <div>
                                <p className="font-black text-slate-800 text-sm">{activeTasks.length}</p>
                                <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Tasks</p>
                              </div>
                              <div>
                                <p className="font-black text-blue-600 text-sm">{emp.completionRate}</p>
                                <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">Success Rate</p>
                              </div>
                              <div>
                                <p className="font-black text-slate-850 text-sm leading-tight truncate">{pos.landmark}</p>
                                <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">GPS Telemetry Node</p>
                              </div>
                            </div>

                            {/* Active status toggler & Simulator */}
                            <div className="space-y-3.5 pt-1">
                              
                              {/* Segmented status selector */}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Roster Status Switchboard</label>
                                <div className="flex gap-1.5 border border-slate-200 p-1 rounded-2xl bg-slate-50">
                                  {['STANDBY', 'DISPATCHED', 'ON LEAVE'].map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => handleUpdateWorkerStatus(emp.id, st)}
                                      className={`flex-grow py-1.5 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${
                                        pos.status === st
                                          ? st === 'ON LEAVE' ? 'bg-red-600 text-white shadow-sm' :
                                            st === 'DISPATCHED' ? 'bg-blue-600 text-white shadow-sm' :
                                            'bg-slate-700 text-white shadow-sm'
                                          : 'text-slate-450 hover:text-slate-800 hover:bg-white/80'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Coordinate simulator */}
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                                <p className="text-slate-700 text-[8.5px] font-mono flex items-center gap-1.5">
                                  <MapPin size={11} className="text-emerald-500 animate-bounce" /> simulated GPS Lock: <span className="text-emerald-600 font-bold">{pos.landmark}</span>
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={() => handleSimulatePosition(emp.id, activeCity === 'rajkot' ? 'Kalavad Road' : 'Connaught Place', activeCity === 'rajkot' ? 22.2904 : 28.6315, activeCity === 'rajkot' ? 70.7749 : 77.2167)}
                                    className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 py-1.5 px-2 rounded-xl text-[8px] text-slate-700 font-black uppercase shadow-xs transition-all"
                                  >
                                    📍 {activeCity === 'rajkot' ? 'Kalavad Rd' : 'Connaught Pl'}
                                  </button>
                                  <button 
                                    onClick={() => handleSimulatePosition(emp.id, activeCity === 'rajkot' ? 'University Road' : 'ITO', activeCity === 'rajkot' ? 22.2929 : 28.6276, activeCity === 'rajkot' ? 70.7687 : 77.2411)}
                                    className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 py-1.5 px-2 rounded-xl text-[8px] text-slate-700 font-black uppercase shadow-xs transition-all"
                                  >
                                    📍 {activeCity === 'rajkot' ? 'University Rd' : 'ITO Intersec'}
                                  </button>
                                </div>
                              </div>

                              {/* Task dispatch tools */}
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setIsAssigningTaskForEmp(isAssigning ? null : emp.id)}
                                  className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                                    isAssigning 
                                      ? 'bg-slate-200 text-slate-750 border border-slate-300' 
                                      : 'bg-blue-50 border border-blue-200 hover:bg-blue-100/70 text-blue-700 shadow-sm'
                                  }`}
                                >
                                  <Send size={10} /> {isAssigning ? 'Cancel Assignment' : 'Assign Active Municipal Task'}
                                </button>
                              </div>

                              {/* Drawer popup */}
                              {isAssigning && (
                                <div className="border-t border-slate-200 pt-3 mt-3 space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-1 duration-200">
                                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Select Task to dispatch:</p>
                                  {filteredNeeds.filter(n => n.assigned_worker_name !== emp.name).map((task) => (
                                    <div 
                                      key={task.id}
                                      onClick={() => handleAssignTaskToEmployee(task.id, emp.name, emp.title)}
                                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all flex justify-between items-start gap-2 text-[10px]"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-slate-800 leading-tight truncate">{task.title}</p>
                                        <div className="flex gap-2 text-[8px] font-mono text-slate-400 mt-1">
                                          <span>Urgency: {task.urgency_score}/10</span>
                                          <span>Crew Size: {task.volunteersNeeded || 2}</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 mt-0.5 truncate">Current: {task.assigned_worker_name || 'Unassigned'}</p>
                                      </div>
                                      <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase flex-shrink-0 border border-blue-200/50">Assign</span>
                                    </div>
                                  ))}
                                  {filteredNeeds.filter(n => n.assigned_worker_name !== emp.name).length === 0 && (
                                    <p className="text-[8px] text-slate-400 italic">No alternative dispatchable tasks found.</p>
                                  )}
                                </div>
                              )}

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })()
          )}
          
        </div>
        
      </div>
    </div>
  );
}
