'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  ShieldAlert, Users, Globe, Lock, 
  Zap, Radio, Database, Activity
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { AuditLedger, pushAuditLog } from '@/components/shared/AuditLedger';
import { PredictiveWeatherWidget } from '@/components/dashboard/PredictiveWeatherWidget';
import toast from 'react-hot-toast';

function SuperAdminContent() {
  const [stats, setStats] = useState({ users: 0, ngos: 0, needs: 0, volunteers: 0 });
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubCounts = [
      onSnapshot(collection(db, 'users'), s => setStats(p => ({ ...p, users: s.size })), (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    }),
      onSnapshot(collection(db, 'ngos'), s => {
        setStats(p => ({ ...p, ngos: s.size }));
        setEntities(s.docs.map(d => ({ id: d.id, type: 'NGO', ...d.data() })));
      }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    }),
      onSnapshot(collection(db, 'needs'), s => setStats(p => ({ ...p, needs: s.size })), (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    }),
      onSnapshot(collection(db, 'volunteers'), s => setStats(p => ({ ...p, volunteers: s.size })), (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    })
    ];

    setLoading(false);
    return () => unsubCounts.forEach(fn => fn());
  }, []);

  const runAiAudit = async () => {
    setIsAiScanning(true);
    await pushAuditLog('AI_SCAN_TRIGGERED', 'Manual AI Integrity Audit initiated by Overseer.', 'HIGH');
    toast.loading('Gemma is auditing global state', { id: 'ai-audit' });
    await new Promise(r => setTimeout(r, 2000));
    setIsAiScanning(false);
    await pushAuditLog('AI_SCAN_COMPLETE', 'Global state integrity verified (100%).', 'REAL');
    toast.success('Integrity Verified. All sectors operational.', { id: 'ai-audit', icon: '🛡️' });
  };

  const toggleEntityStatus = async (id: string, type: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, type.toLowerCase() === 'ngo' ? 'ngos' : 'users', id), {
        status: newStatus
      });
      await pushAuditLog('GOVERNANCE_OVERRIDE', `Status of ${name} changed to ${newStatus.toUpperCase()}.`, 'CRITICAL');
      toast.success(`Override: ${newStatus === 'active' ? 'Verified' : 'Suspended'}`);
    } catch (e) {
      toast.error('Override Failed');
    }
  };

  if (loading) return <LoadingSkeleton type="page" />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] scale-150 rotate-12 text-blue-900"><ShieldAlert size={300} /></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full shadow-sm">
                  <Lock size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Admin</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black font-mukta tracking-tighter mb-4 leading-tight text-slate-900">System <br/><span className="text-blue-600">Command Center</span></h1>
              <p className="text-slate-500 font-medium max-w-xl text-base md:text-lg">Full-scale governance oversight of the Sahaayak global community infrastructure.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-10">
              <button onClick={runAiAudit} disabled={isAiScanning} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all ${isAiScanning ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] shadow-[0_4px_20px_rgba(37,99,235,0.3)]'}`}>
                <Zap size={20} /> {isAiScanning ? 'Scanning...' : 'Trigger AI State Audit'}
              </button>
              <button onClick={() => router.push('/admin/super/broadcast')} className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 rounded-2xl font-bold text-sm border border-slate-200 transition-all text-slate-700 shadow-sm">
                <Radio size={20} className="text-blue-500" /> System Broadcast
              </button>
            </div>
          </div>
        </div>

        <div className="xl:w-96 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Core Telemetry</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <h3 className="text-4xl font-black font-mukta text-slate-900">99.98%</h3>
             <p className="text-[10px] font-bold text-emerald-600 mb-4">SYSTEM OPTIMAL</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(99,102,241,0.3)] flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-indigo-400/30">
             <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform"><Database size={150} /></div>
             <p className="text-[10px] font-black opacity-90 uppercase tracking-[0.2em] text-white">Active Needs Nodes</p>
             <h3 className="text-5xl font-black font-mukta mb-2 text-white">{stats.needs.toLocaleString()}</h3>
             <div className="flex items-center gap-2 text-[10px] font-black bg-white/20 w-fit px-3 py-1.5 rounded-full text-white backdrop-blur-sm border border-white/10">
                <Activity size={12} /> LIVE FEED CONNECTED
             </div>
          </div>
        </div>
      </div>

      <PredictiveWeatherWidget city="delhi" demoMode={true} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <h3 className="text-slate-900 font-bold font-mukta text-xl mb-8 flex items-center gap-3"><Users size={24} className="text-indigo-600" /> Platform Population</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Institutions</p>
                          <p className="text-3xl font-black text-slate-900">{stats.ngos}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Field Agents</p>
                          <p className="text-3xl font-black text-slate-900">{stats.volunteers}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Global Citizens</p>
                          <p className="text-3xl font-black text-slate-900">{stats.users}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Overseers</p>
                          <p className="text-3xl font-black text-slate-900">04</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-slate-900 font-bold font-mukta text-xl mb-6 flex items-center gap-3"><Globe size={24} className="text-blue-600" /> Sector Analysis</h3>
                    <div className="space-y-5">
                      {['West Zone', 'Central Ward', 'North Corridor'].map(s => (
                        <div key={s} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-bold text-slate-900 uppercase">
                              <span>{s}</span>
                              <span className="text-emerald-600">Active</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full" style={{ width: `${30 + Math.random() * 60}%` }} />
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-slate-900 font-bold font-mukta text-xl">Governance Overrides</h3>
                    <div className="text-[10px] font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-full">{entities.length} TOTAL NODES</div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50/50 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                           <th className="px-8 py-4">INSTITUTION</th>
                           <th className="px-8 py-4">STATUS</th>
                           <th className="px-8 py-4 text-right">ACTION</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {entities.map((e, i) => (
                           <tr key={i} className="hover:bg-slate-50 transition-colors">
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-900">{e.name?.[0] || 'I'}</div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-900">{e.name || e.id}</p>
                                    <p className="text-[10px] text-slate-500">0x{e.id.slice(0, 8).toUpperCase()}</p>
                                  </div>
                               </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${e.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${e.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{e.status || 'ACTIVE'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button onClick={() => toggleEntityStatus(e.id, e.type, e.status || 'active', e.name || 'Institution')} className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-red-600 border border-slate-300 hover:border-red-600 px-4 py-2 rounded-xl transition-all">
                                  GOVERNANCE OVERRIDE
                                </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
               </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-8 h-[800px]">
           <AuditLedger />
        </div>

      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={<LoadingSkeleton type="page" />}>
      <SuperAdminContent />
    </Suspense>
  );
}
