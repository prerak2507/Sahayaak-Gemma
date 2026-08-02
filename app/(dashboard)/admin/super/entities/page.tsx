'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Database, Search, Filter, ShieldCheck, XCircle } from 'lucide-react';
import { AuditLedger, pushAuditLog } from '@/components/shared/AuditLedger';
import toast from 'react-hot-toast';

export default function GlobalEntitiesPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ngos'), s => {
      setEntities(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });
    return () => unsub();
  }, []);

  const toggleStatus = async (id: string, current: string, name: string) => {
    const next = current === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'ngos', id), { status: next });
    await pushAuditLog('ENTITY_UPDATE', `${name} status toggled to ${next.toUpperCase()}.`, 'HIGH');
    toast.success(`Entity ${next}`);
  };

  const filtered = entities.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) || 
    e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-mukta text-slate-900 tracking-tighter">Global Entities</h1>
          <p className="text-slate-500 font-medium">Supreme Ledger of all verified institutions.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by UID or Name..." 
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-80 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-[800px] flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{filtered.length} INSTITUTIONS ACTIVE</p>
            <Filter size={18} className="text-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4">ENTITY NODE</th>
                  <th className="px-8 py-4">GOVERNANCE</th>
                  <th className="px-8 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg">{e.name?.[0] || 'N'}</div>
                        <div>
                          <p className="font-black text-slate-900">{e.name || 'Unnamed'}</p>
                          <p className="text-[10px] font-mono text-slate-400">UID: 0x{e.id.slice(0, 12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${e.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {e.status === 'active' ? <ShieldCheck size={12} /> : <XCircle size={12} />}
                        {e.status || 'ACTIVE'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => toggleStatus(e.id, e.status || 'active', e.name || 'NGO')}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-red-600 border border-slate-200 px-4 py-2 rounded-xl transition-all hover:bg-white hover:shadow-lg"
                       >
                         {e.status === 'active' ? 'SUSPEND NODE' : 'RESTORE NODE'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 h-[800px]">
          <AuditLedger />
        </div>
      </div>
    </div>
  );
}
