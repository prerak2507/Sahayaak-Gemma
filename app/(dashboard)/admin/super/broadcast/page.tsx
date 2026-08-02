'use client';

import { useState } from 'react';
import { AuditLedger, pushAuditLog } from '@/components/shared/AuditLedger';
import { Radio, Send, ShieldAlert, Globe, CheckCircle, XCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    setIsBroadcasting(true);
    try {
      await pushAuditLog('SYSTEM_BROADCAST', `Emergency broadcast sent: "${message.slice(0, 30)}..."`, 'CRITICAL');
      
      await addDoc(collection(db, 'broadcasts'), {
        message: message.trim(),
        sender: 'SUPREME_OVERSEER',
        type: 'EMERGENCY',
        timestamp: serverTimestamp(),
        active: true
      });

      toast.success('Broadcast transmitted globally.');
      setMessage('');
    } catch (error) {
      console.error('Broadcast failed', error);
      toast.error('Failed to transmit broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const deactivateAllBroadcasts = async () => {
    if (!window.confirm('This will remove all emergency banners from all users dashboards. Proceed?')) return;
    setIsDeactivating(true);
    try {
      const q = query(collection(db, 'broadcasts'), where('active', '==', true));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('No active broadcasts to clear.');
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(doc(db, 'broadcasts', d.id), { active: false });
      });
      
      await batch.commit();
      await pushAuditLog('BROADCAST_TERMINATED', 'All active global broadcasts deactivated.', 'HIGH');
      toast.success('Global emergency status cleared.');
    } catch (error) {
      console.error('Deactivation failed', error);
      toast.error('Failed to clear broadcasts.');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black font-mukta text-slate-900 tracking-tighter">Emergency Radio</h1>
          <p className="text-slate-600 font-medium mt-1">Direct low-latency communication with all active nodes.</p>
        </div>
        <button 
          onClick={deactivateAllBroadcasts}
          disabled={isDeactivating}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
        >
          {isDeactivating ? 'Clearing...' : <><CheckCircle size={16} /> Mark Emergency Over</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white text-slate-900 p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center border border-red-100 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 opacity-[0.03] scale-[3] text-red-600 rotate-12"><Radio size={300} /></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4 text-red-600 mb-2">
               <ShieldAlert size={32} />
               <h2 className="text-3xl font-black font-mukta uppercase tracking-tight text-slate-900">Global Override Input</h2>
            </div>
            
            <p className="text-slate-600 font-medium text-lg leading-relaxed">This terminal broadcasts directly to the mobile devices of all volunteers and NGOs within the Sahaayak network. Use with extreme caution.</p>
            
            <div className="space-y-4">
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter emergency directive..."
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all resize-none shadow-inner"
              />
              
              <button 
                onClick={handleBroadcast}
                disabled={isBroadcasting || !message.trim()}
                className="w-full py-6 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-3xl font-black text-lg tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_8px_30px_rgba(220,38,38,0.2)] uppercase"
              >
                {isBroadcasting ? 'Transmitting...' : <><Send size={24} /> Execute Broadcast</>}
              </button>
            </div>
            
            <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <Globe size={14} className="text-emerald-500" /> Network Status: Secure
               </div>
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <Radio size={14} className="text-blue-500" /> Channels: 12 Active
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 h-[800px]">
          <AuditLedger />
        </div>
      </div>
    </div>
  );
}
