'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { 
  Bell, ShieldAlert, Clock, CheckCircle, Radio, Megaphone, 
  Activity, Send, Check, Trash2, Volume2, Plus, AlertCircle, ArrowRight
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import toast from 'react-hot-toast';

// 👥 Field Technicians per Department for automatic dispatches
const DEPARTMENT_EMPLOYEES: Record<string, Array<{ id: string; name: string; title: string; avatar: string; defaultStatus: string; phone: string }>> = {
  pwd: [
    { id: 'emp-pwd-1', name: 'Jayesh Rathod', title: 'PWD Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-pwd-1', defaultStatus: 'DISPATCHED', phone: '+91 94280 12345' },
    { id: 'emp-pwd-2', name: 'Amrit Parmar', title: 'Road Maintenance Assistant', avatar: 'https://i.pravatar.cc/150?u=emp-pwd-2', defaultStatus: 'STANDBY', phone: '+91 94280 67890' }
  ],
  health_sanitation: [
    { id: 'emp-san-1', name: 'Ramesh Koli', title: 'Ward 7 Sanitation Inspector', avatar: 'https://i.pravatar.cc/150?u=emp-san-1', defaultStatus: 'DISPATCHED', phone: '+91 94281 12345' },
    { id: 'emp-san-2', name: 'Hasmukh Vora', title: 'Solid Waste Supervisor', avatar: 'https://i.pravatar.cc/150?u=emp-san-2', defaultStatus: 'STANDBY', phone: '+91 94281 67890' }
  ],
  water_works: [
    { id: 'emp-water-1', name: 'Tushar Trivedi', title: 'Pipeline Field Assistant', avatar: 'https://i.pravatar.cc/150?u=emp-water-1', defaultStatus: 'DISPATCHED', phone: '+91 94282 12345' },
    { id: 'emp-water-2', name: 'Mansukh Koli', title: 'Pump Station Valve Operator', avatar: 'https://i.pravatar.cc/150?u=emp-water-2', defaultStatus: 'STANDBY', phone: '+91 94282 67890' }
  ],
  drainage: [
    { id: 'emp-drain-1', name: 'Sohan Prasad', title: 'Sewer Jetting Operator', avatar: 'https://i.pravatar.cc/150?u=emp-drain-1', defaultStatus: 'DISPATCHED', phone: '+91 94283 12345' },
    { id: 'emp-drain-2', name: 'Manu Rabari', title: 'Drainage Network Inspector', avatar: 'https://i.pravatar.cc/150?u=emp-drain-2', defaultStatus: 'STANDBY', phone: '+91 94283 67890' }
  ],
  electricity: [
    { id: 'emp-elec-1', name: 'Vijay Parmar', title: 'High Voltage Lineman', avatar: 'https://i.pravatar.cc/150?u=emp-elec-1', defaultStatus: 'DISPATCHED', phone: '+91 94284 12345' },
    { id: 'emp-elec-2', name: 'Haresh Solanki', title: 'Substation Technician', avatar: 'https://i.pravatar.cc/150?u=emp-elec-2', defaultStatus: 'STANDBY', phone: '+91 94284 67890' }
  ],
  encroachment: [
    { id: 'emp-enc-1', name: 'Ketan Chawda', title: 'Field Demolition Officer', avatar: 'https://i.pravatar.cc/150?u=emp-enc-1', defaultStatus: 'DISPATCHED', phone: '+91 94285 12345' },
    { id: 'emp-enc-2', name: 'Kanti Bhai', title: 'Estate Encroachment Surveyor', avatar: 'https://i.pravatar.cc/150?u=emp-enc-2', defaultStatus: 'STANDBY', phone: '+91 94285 67890' }
  ],
  fire_safety: [
    { id: 'emp-fire-1', name: 'Kanu Vaghela', title: 'Rescue Station Commander', avatar: 'https://i.pravatar.cc/150?u=emp-fire-1', defaultStatus: 'STANDBY', phone: '+91 94286 12345' },
    { id: 'emp-fire-2', name: 'Manoj Chavda', title: 'Hazard Containment Specialist', avatar: 'https://i.pravatar.cc/150?u=emp-fire-2', defaultStatus: 'DISPATCHED', phone: '+91 94286 67890' }
  ]
};

// Synthesis audio synthesizer chime for feedback
const playSynthesizerChime = (type: 'alert' | 'success' | 'click') => {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'alert') {
      // Futuristic double sonar ping
      const f1 = 880, f2 = 1320;
      [0, 0.12].forEach((delay, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(i === 0 ? f1 : f2, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + delay + 0.35);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.45);
      });
    } else if (type === 'success') {
      // Arpeggio chime
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, index) => {
        const delay = index * 0.08;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + delay + 0.25);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.3);
      });
    } else {
      // Micro click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.06);
    }
  } catch (e) {
    console.warn('Audio Context blocked or unsupported:', e);
  }
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation & dynamic interaction states
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'logs'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isDeployingBroadcast, setIsDeployingBroadcast] = useState(false);
  const [isInjectingMock, setIsInjectingMock] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Live Listen to Global Active Emergency Broadcasts
    const broadcastQuery = query(
      collection(db, 'broadcasts'),
      where('active', '==', true)
    );

    // 2. Live Listen to Departmental AI Incidents (mapped as Notifications)
    const notificationQuery = query(
      collection(db, 'needs'),
      where('assigned_department', '==', user.department || 'pwd')
    );

    const unsubBroadcasts = onSnapshot(broadcastQuery, (snapshot) => {
      const activeBroadcasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isBroadcast: true }));
      // Sort in-memory to prevent composite index requirement
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
      const docs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const isCritical = data.urgency_score >= 8;
        const isResolved = data.status === 'completed' || data.is_archived;

        return {
          id: docSnap.id,
          user_id: user.id,
          text: `[${(data.category || 'INCIDENT').toUpperCase()}] ${data.title} at ${data.landmark || 'Unknown Sector'}`,
          type: isCritical ? 'CRITICAL' : 'GENERAL',
          is_read: isResolved, 
          created_at: data.created_at || new Date().toISOString(),
          details: {
            title: data.title,
            desc: data.description,
            department: data.assigned_department,
            landmark: data.landmark,
            lat: data.latitude,
            lng: data.longitude,
            urgencyScore: data.urgency_score,
            routingReason: data.routing_reason,
            assignedWorkerName: data.assigned_worker_name,
            assignedWorkerTitle: data.assigned_worker_title,
            assignedWorkerAvatar: data.assigned_worker_avatar,
            imageUrl: data.image_url,
            resolutionImageUrl: data.resolution_image_url,
            resolutionFeedback: data.resolution_feedback
          }
        };
      });
      
      docs.sort((a: any, b: any) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA;
      });
      
      setNotifications(docs);
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

  // Play micro click on tab switch
  const handleTabSwitch = (tab: 'all' | 'critical' | 'logs') => {
    playSynthesizerChime('click');
    setActiveTab(tab);
  };

  // Interactive: Dynamic Mock Incident Injector (Injects custom alerts directly to this department!)
  const handleInjectMockIncident = async () => {
    if (!user) return;
    setIsInjectingMock(true);
    playSynthesizerChime('click');

    const incidentTemplates: Record<string, Array<{ title: string; desc: string }>> = {
      pwd: [
        { title: "Road Pothole Cavity", desc: "Structural road failure reported with severe cracks and asphalt deterioration." },
        { title: "Pavement Structural Fracture", desc: "Pavement fracturing causing high hazard to pedestrians and vehicles." },
        { title: "Highway Asphalt Caving", desc: "Sudden caving under heavy traffic load. Structural reinforcement needed." },
        { title: "Traffic Island Damage", desc: "Vehicle collision has damaged the central traffic divisor, leaving concrete debris on the fast lane." }
      ],
      health_sanitation: [
        { title: "Illegal Dumping Accumulation", desc: "Massive pile of solid civic waste dumped illegally on public walkway." },
        { title: "Bio-medical Waste Dump", desc: "Untreated medical waste discarded behind clinic zone posing public bio-hazard." },
        { title: "Debris Spill Hazard", desc: "Construction debris spilled across the carriage-way, obstructing sanitation vehicles." },
        { title: "Garbage Collector Overflow", desc: "Commercial bin overflowed. Heavy stench and animal gathering reported." }
      ],
      water_works: [
        { title: "Water Main Pipeline Burst", desc: "Underground main line rupture causing water pressure drop and heavy local flooding." },
        { title: "Feeder Pipe Leakage", desc: "High-pressure leakage detected. Constant civic water loss near residential sector." },
        { title: "Sub-station Valve Failure", desc: "Main control valve jammed, halting water distribution to ward sub-grids." },
        { title: "Civic Reservoir Contamination", desc: "Suspicious discoloration in reservoir outflow. Immediate purging required." }
      ],
      drainage: [
        { title: "Sewage Jet Pump Blockage", desc: "Sewerage block causing backup and overflow into residential basements." },
        { title: "Gully Pot Clogging", desc: "Stormwater entry grid clogged with plastic refuse, causing instant street flooding." },
        { title: "Manhole Displacement", desc: "Main road manhole cover fractured and displaced by heavy vehicle load." },
        { title: "Sub-Sewer Network Leak", desc: "Raw effluent leakage leaking from joints of underground sewer lines." }
      ],
      electricity: [
        { title: "High-Voltage Cable Sparking", desc: "Overhead lines contact causing power surges and imminent fire hazard." },
        { title: "Transformer Overheating", desc: "Local substation transformer overheating under peak load. Critical warning." },
        { title: "Streetlight Grid Blackout", desc: "Complete failure of automatic solar streetlighting grid along major artery." },
        { title: "Feeder Pillar Damage", desc: "Damaged fuse panel door exposing high voltage copper elements." }
      ],
      encroachment: [
        { title: "Illegal Market Blockade", desc: "Temporary shops blockading main emergency fire lane near central market." },
        { title: "Footpath Vendor Block", desc: "Footpaths completely blockaded by commercial structures forcing pedestrians to walk on main road." },
        { title: "Illegal Structure Erection", desc: "Encroaching steel structure constructed on public parking lot overnight." },
        { title: "Civic Access Encroachment", desc: "Ramp extension built over stormwater channel, completely blocking service access." }
      ],
      fire_safety: [
        { title: "Commercial Structure Fire Risk", desc: "Defective fire extinguishers and blocked fire escape detected during safety check." },
        { title: "Emergency Exit Blockade", desc: "Exit corridors barricaded and locked in high-occupancy complex. Extreme fire hazard." },
        { title: "Chemical Storage Spill", desc: "Leaking storage drums containing corrosive cleaning compounds inside trade warehouse." },
        { title: "Public Hydrant Blockade", desc: "Uncontrolled construction materials blocking fast hookup fire hydrants." }
      ]
    };

    const depts = ['pwd', 'health_sanitation', 'water_works', 'drainage', 'electricity', 'encroachment', 'fire_safety'];
    const userDept = user.department && user.department !== 'all' ? user.department : depts[Math.floor(Math.random() * depts.length)];

    const templates = incidentTemplates[userDept] || incidentTemplates.pwd;
    const template = templates[Math.floor(Math.random() * templates.length)];

    const landmarks = [
      { name: 'Kalavad Road', lat: 22.2904, lng: 70.7749 },
      { name: 'University Road', lat: 22.2929, lng: 70.7687 },
      { name: 'Yagnik Road', lat: 22.2996, lng: 70.7974 },
      { name: 'Madhapar Junction', lat: 22.3278, lng: 70.7831 },
      { name: 'Gondal Road', lat: 22.2848, lng: 70.8038 },
      { name: 'Mavdi Area', lat: 22.2741, lng: 70.7915 },
      { name: 'Central Delhi', lat: 22.3039, lng: 70.8022 }
    ];
    const loc = landmarks[Math.floor(Math.random() * landmarks.length)];

    const urgencyScore = Math.floor(Math.random() * 8) + 3; // Random score 3 to 10
    const isCritical = urgencyScore >= 8;

    let assignedWorkerName = null;
    let assignedWorkerTitle = null;
    let assignedWorkerAvatar = null;
    let status = 'reported';
    let routingReason = '';
    let notificationText = '';

    if (isCritical) {
      status = 'reported';
      routingReason = `🚨 CRITICAL INCIDENT SEVERITY: Recommended for direct HOD collaborative crew assembly. Joint team effort required on-site.`;
      notificationText = `🚨 Critical Emergency: "${template.title}" reported at ${loc.name}. Urgency score: ${urgencyScore}/10. Recommended for joint HOD team dispatch!`;
    } else {
      const crew = DEPARTMENT_EMPLOYEES[userDept] || [];
      if (crew.length > 0) {
        const emp = crew[Math.floor(Math.random() * crew.length)];
        assignedWorkerName = emp.name;
        assignedWorkerTitle = emp.title;
        assignedWorkerAvatar = emp.avatar;
        status = 'dispatched';
        routingReason = `Directly assigned to Field Specialist ${emp.name} (${emp.title}) by automated departmental load balancer due to stable severity index.`;
        notificationText = `🟢 Dispatched Incident: "${template.title}" at ${loc.name} assigned directly to ${emp.name} (${emp.title}). Urgency score: ${urgencyScore}/10.`;
      } else {
        routingReason = `No active technicians registered in department. Awaiting manual dispatch override.`;
        notificationText = `🟢 Incident Logged: "${template.title}" at ${loc.name}. Urgency score: ${urgencyScore}/10. Awaiting HOD assignment.`;
      }
    }

    try {
      // 1. Write the dynamic incident to 'needs' collection so it renders on Leaflet GIS maps and incident tables!
      const needRef = doc(collection(db, 'needs'));
      await setDoc(needRef, {
        id: needRef.id,
        title: `${template.title} [Incident #${Math.floor(Math.random() * 900) + 100}]`,
        description: `${template.desc} Identified at Delhi municipal quadrant coordinate vectors. Immediate action recommended.`,
        category: 'government',
        status: status,
        assigned_department: userDept,
        landmark: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
        urgency_score: urgencyScore,
        severity_rating: isCritical ? 9 : 5,
        routing_reason: routingReason,
        assigned_worker_name: assignedWorkerName,
        assigned_worker_title: assignedWorkerTitle,
        assigned_worker_avatar: assignedWorkerAvatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // We no longer write to a separate 'notifications' collection.
      // Since Notifications dynamically map from the 'needs' collection above,
      // creating the need automatically triggers the sidebar badge and alerts feed!

      playSynthesizerChime('alert');
      // No toast.success popup per user request! 
      // The notification simply syncs silently to the notification center.
    } catch (e) {
      console.error(e);
      toast.error('Failed to inject simulated incident.');
    } finally {
      setIsInjectingMock(false);
    }
  };

  // Interactive: Deploy District Override Broadcast (Publish custom overrides live to the server)
  const handleDeployBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsDeployingBroadcast(true);
    playSynthesizerChime('click');

    try {
      const bRef = doc(collection(db, 'broadcasts'));
      await setDoc(bRef, {
        id: bRef.id,
        message: `📢 [District Command Override]: ${broadcastMessage.trim()}`,
        active: true,
        timestamp: new Date()
      });

      playSynthesizerChime('success');
      toast.success('Emergency District Broadcast published live!', {
        icon: '🔊',
        style: { background: '#1e293b', color: '#10b981' }
      });
      setBroadcastMessage('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to dispatch broadcast');
    } finally {
      setIsDeployingBroadcast(false);
    }
  };

  // Interactive: Acknowledge & Stable Sync Notification (Changes is_read to true)
  const handleAcknowledgeNotification = async (notifId: string) => {
    playSynthesizerChime('success');
    try {
      const ref = doc(db, 'needs', notifId);
      // Mark as completed so it resolves and moves to 'Stabilized Logs' (is_read = true)
      await updateDoc(ref, { status: 'completed', routing_reason: 'Incident acknowledged and forcefully stabilized by Command.' });
      toast.success('Incident status synced & stabilized!', {
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      });
    } catch (e) {
      toast.error('Failed to stabilize incident.');
    }
  };

  // Interactive: Delete Notification from Live Feed
  const handleDeleteNotification = async (notifId: string) => {
    playSynthesizerChime('click');
    try {
      await deleteDoc(doc(db, 'needs', notifId));
      toast('Alert cleared from dashboard archives', { icon: '🗑️' });
    } catch (e) {
      toast.error('Failed to clear alert.');
    }
  };

  if (isLoading) return <LoadingSkeleton type="page" />;

  // Dynamic filter arrays
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'critical') return n.type === 'CRITICAL';
    if (activeTab === 'logs') return n.is_read === true;
    return true;
  });

  const unreadAlerts = notifications.filter(n => !n.is_read).length;
  const criticalAlerts = notifications.filter(n => n.type === 'CRITICAL').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      
      {/* 🚀 TECH METRIC CARD COUNTERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Bell size={64} className="text-blue-400" /></div>
          <span className="text-[10px] font-extrabold text-blue-200 tracking-[0.2em] uppercase">Unresolved Alerts</span>
          <h2 className="text-4xl font-black text-blue-400 font-mukta">{unreadAlerts}</h2>
          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">Active & Pending Sync</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldAlert size={64} className="text-red-400" /></div>
          <span className="text-[10px] font-extrabold text-red-200 tracking-[0.2em] uppercase">Critical Emergencies</span>
          <h2 className="text-4xl font-black text-red-500 font-mukta">{criticalAlerts}</h2>
          <span className="text-[9px] font-mono text-red-300/80 font-bold uppercase tracking-widest">Immediate Escalation</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Radio size={64} className="text-emerald-400" /></div>
          <span className="text-[10px] font-extrabold text-emerald-200 tracking-[0.2em] uppercase">Command Sync Status</span>
          <h2 className="text-4xl font-black text-emerald-400 font-mukta">ACTIVE</h2>
          <span className="text-[9px] font-mono text-emerald-300/80 font-bold uppercase tracking-widest">Latency: 18ms Telemetry</span>
        </div>
        {/* Live Simulation Injector Card Trigger */}
        <button 
          onClick={handleInjectMockIncident}
          disabled={isInjectingMock}
          className="group bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-3xl p-6 flex flex-col justify-between h-32 transition-all active:scale-95 shadow-2xl relative overflow-hidden text-left border border-blue-500/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 transition-transform"><Plus size={64} /></div>
          <span className="text-[10px] font-black text-blue-200 tracking-[0.2em] uppercase">Simulation Console</span>
          <div>
            <h3 className="font-extrabold text-sm font-mukta flex items-center gap-1.5">
              {isInjectingMock ? 'Injecting Node...' : 'Trigger Live Mock Incident'} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[8.5px] text-blue-200 mt-1 leading-relaxed uppercase tracking-wider">Simulates live incoming citizen reports for {user?.department?.replace('_', ' ') || 'District'}</p>
          </div>
        </button>
      </div>

      {/* Primary Spacious 2-Column Command Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Alerts Feed Panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-2xl font-black font-mukta text-slate-800 tracking-tight flex items-center gap-2.5">
                <Bell size={22} className="text-blue-600 animate-pulse" /> Telemetry alerts feed
              </h1>
              <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mt-0.5">District Command & Control Center</p>
            </div>
            
            {/* Elegant Tab Filters */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'critical', label: '🚨 Critical Only' },
                { id: 'logs', label: '🟢 Synced Logs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Broadcasts Grid (Flashes red) */}
          {broadcasts.length > 0 && (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div key={b.id} className="p-6 rounded-[2rem] bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-900/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldAlert size={80} /></div>
                  <div className="relative z-10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">BROADCAST INTERCEPT</span>
                      <span className="text-[10px] font-mono opacity-80">{timeAgo(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp)}</span>
                    </div>
                    <p className="text-base font-extrabold leading-snug">{b.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spacious glowing Notification Feed Card List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 && (
              <div className="p-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Bell className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-bold font-mukta text-lg">No active telemetric notifications.</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Use the Simulation Console to inject interactive mock data</p>
              </div>
            )}

            {filteredNotifications.map((n) => {
              const date = n.created_at ? new Date(n.created_at) : new Date();
              const isCritical = n.type === 'CRITICAL';
              const isRead = n.is_read;

              return (
                <div 
                  key={n.id} 
                  className={`group relative p-6 rounded-[2rem] border transition-all duration-300 hover:translate-x-1.5 shadow-sm ${
                    isRead 
                      ? 'bg-slate-50 border-slate-200/60 opacity-70' 
                      : isCritical 
                        ? 'bg-red-50/60 border-red-200 ring-1 ring-red-100 hover:border-red-300' 
                        : 'bg-white border-blue-100 hover:border-blue-200'
                  }`}
                >
                  {/* Neon pulsing left border indicator */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-[2rem] ${
                    isRead ? 'bg-slate-300' : isCritical ? 'bg-red-600 animate-pulse' : 'bg-blue-500'
                  }`} />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      {/* Telemetry Status Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isRead 
                          ? 'bg-slate-200 text-slate-600' 
                          : isCritical 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {isRead ? <CheckCircle size={22} /> : isCritical ? <ShieldAlert size={22} /> : <Clock size={22} />}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <p className={`text-[14px] leading-relaxed ${isRead ? 'text-slate-500 font-medium' : 'font-extrabold text-slate-900 font-mukta'}`}>
                          {n.text}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                            isRead ? 'bg-slate-200 text-slate-700 border-slate-300' : isCritical ? 'bg-red-600 text-white border-red-700' : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {isRead ? 'Stabilized' : isCritical ? 'Critical Escalation' : 'Standard Log'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-extrabold flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action Triggers inside alert card */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {!isRead ? (
                        <button
                          onClick={() => setSelectedNotification(n)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                          title="Inspect and Acknowledge Report Details"
                        >
                          <Check size={12} /> Acknowledge
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedNotification(n)}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                          title="Inspect Historic Details"
                        >
                          Inspect Details
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-all border border-slate-200/50"
                        title="Archive alert"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: District Broadcast Dispatch Console (1/3 width) */}
        <div className="space-y-6">
          
          {/* Broadcast Dispatcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-slate-100 space-y-6">
            
            {/* Tech grid mesh background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-[0.25em] flex items-center gap-1.5">
                <Radio size={14} className="animate-pulse" /> Dispatch Terminal
              </span>
              <h3 className="text-xl font-bold font-mukta text-white">Emergency District Broadcast Console</h3>
              <p className="text-[11px] text-slate-200/90 font-medium leading-relaxed uppercase tracking-wider">Deploys priority alert banners across all active volunteer grids, NGO modules, and City telemetry node dashboards instantly.</p>
            </div>

            <form onSubmit={handleDeployBroadcast} className="relative z-10 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-200">Broadcast Directive Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Flood hazard on University Road. All units stand down and report to PWD depot..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-semibold text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isDeployingBroadcast || !broadcastMessage.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Megaphone size={14} />
                {isDeployingBroadcast ? 'Deploying Override...' : 'Deploy Overrides Broadcast'}
              </button>
            </form>
          </div>

          {/* District Status telemetry stats */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h4 className="font-extrabold font-mukta text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" /> Operational telemetry
            </h4>
            
            <div className="space-y-4 text-slate-800 text-xs">
              {[
                { label: 'PWD Roads Dept Node', val: 'STABLE', color: 'text-emerald-600' },
                { label: 'Water Works Supply', val: '94% PRESSURE', color: 'text-blue-600' },
                { label: 'Drainage Mains Overflow', val: 'CRITICAL WARNING', color: 'text-red-600 animate-pulse font-extrabold' },
                { label: 'Power & Grid Node', val: 'STABLE', color: 'text-emerald-600' },
                { label: 'Emergency Fire Brigades', val: '100% STANDBY', color: 'text-emerald-600' }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0">
                  <span className="font-extrabold text-slate-800 uppercase text-[9px] tracking-wider">{stat.label}</span>
                  <span className={`text-[10px] font-black uppercase ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>
        </div>

      </div>

    </div>

      {/* 🔮 ADVANCED INCIDENT TELEMETRY INSPECTOR MODAL */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] max-w-xl w-full p-8 relative shadow-2xl space-y-6 overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-400 tracking-[0.25em] uppercase flex items-center gap-1.5">
                  <Activity size={14} className="animate-pulse" /> Telemetry Node Inspector
                </span>
                <h3 className="text-xl font-bold font-mukta text-white mt-1">
                  {selectedNotification.details?.title || "Simulated Incident Report"}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-800 rounded-xl"
              >
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>

            {/* High Impact Urgency Alert Banner */}
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
              (selectedNotification.details?.urgencyScore >= 8 || selectedNotification.type === 'CRITICAL')
                ? 'bg-red-955/40 bg-red-950/40 border-red-800/60 text-red-200' 
                : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-ping ${
                  (selectedNotification.details?.urgencyScore >= 8 || selectedNotification.type === 'CRITICAL') ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {(selectedNotification.details?.urgencyScore >= 8 || selectedNotification.type === 'CRITICAL')
                    ? `🚨 CRITICAL RISK INDEX DETECTED`
                    : `🟢 STANDARD OPERATIONAL HAZARD`
                  }
                </span>
              </div>
              <span className="text-sm font-black font-mono">
                {selectedNotification.details?.urgencyScore || (selectedNotification.type === 'CRITICAL' ? 9 : 5)}/10 Urgency
              </span>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Delhi Landmark</span>
                <p className="font-extrabold text-slate-200 flex items-center gap-1">
                  📍 {selectedNotification.details?.landmark || "Yagnik Road Market"}
                </p>
              </div>
              <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">City Department Node</span>
                <p className="font-extrabold text-slate-250 uppercase">
                  🏢 {selectedNotification.details?.department?.replace('_', ' ') || user?.department || 'PWD Roads'}
                </p>
              </div>
              <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Geodetic Latitude</span>
                <p className="font-extrabold font-mono text-slate-300">
                  {selectedNotification.details?.lat || "22.2996"} N
                </p>
              </div>
              <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Geodetic Longitude</span>
                <p className="font-extrabold font-mono text-slate-300">
                  {selectedNotification.details?.lng || "70.7974"} E
                </p>
              </div>
            </div>

            {/* Full Report Description Box */}
            <div className="bg-slate-950/30 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} /> Live Citizen Description Block
              </span>
              <p className="text-xs font-semibold text-slate-350 leading-relaxed italic">
                "{selectedNotification.details?.desc || selectedNotification.text.replace(/🚨 Simulated Emergency: ".*?" - /, '')}"
              </p>
            </div>

            {/* Dispatch recommendation or current dispatch state */}
            <div className={`p-4 rounded-2xl border ${
              (selectedNotification.details?.urgencyScore >= 8 || selectedNotification.type === 'CRITICAL')
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-250'
            }`}>
              <div className="flex gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">
                    {(selectedNotification.details?.urgencyScore >= 8 || selectedNotification.type === 'CRITICAL')
                      ? "⚠️ Supervisor Collaborative Squad Recommendation"
                      : "✅ Automated Specialty Roster Dispatch"
                    }
                  </span>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {selectedNotification.details?.routingReason || 
                     ((selectedNotification.type === 'CRITICAL') 
                        ? "🚨 CRITICAL SEVERITY: Recommended for direct HOD collaborative crew assembly. Joint team effort required."
                        : "Directly assigned to Field Specialist PWD Field Engineers by automated load balancer due to stable severity index.")
                    }
                  </p>
                  {selectedNotification.details?.assignedWorkerName && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-900/40">
                      <img 
                        src={selectedNotification.details.assignedWorkerAvatar || "https://i.pravatar.cc/150?u=emp"} 
                        alt={selectedNotification.details.assignedWorkerName} 
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-[10px] font-bold text-emerald-300">
                        Dispatched Specialist: {selectedNotification.details.assignedWorkerName} ({selectedNotification.details.assignedWorkerTitle})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Verification Comparison for Completed Tasks */}
            {selectedNotification.is_read && selectedNotification.details?.resolutionImageUrl && (
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle size={14} /> AI Resolution Verified
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Original Report</span>
                    <div className="aspect-video bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
                      {selectedNotification.details?.imageUrl ? (
                        <img src={selectedNotification.details.imageUrl} alt="Original" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs font-mono">NO IMAGE</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest block">AI Confirmed Resolution</span>
                    <div className="aspect-video bg-slate-900 rounded-xl border-2 border-emerald-900/50 overflow-hidden relative">
                      <img src={selectedNotification.details.resolutionImageUrl} alt="Resolution" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {selectedNotification.details?.resolutionFeedback && (
                  <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/40">
                    <p className="text-xs font-medium text-emerald-200 leading-relaxed">
                      "{selectedNotification.details.resolutionFeedback}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-3 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel Inspection
              </button>
              {!selectedNotification.is_read && (
                <button 
                  onClick={async () => {
                    await handleAcknowledgeNotification(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Check size={14} /> Acknowledge & Sync Telemetry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
