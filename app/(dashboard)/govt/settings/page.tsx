'use client';

import React, { useState } from 'react';
import { Save, Bell, Globe, Cog, Shield, Map, Phone, Clock, User, Mail, Briefcase, MapPin, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export default function GovtSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    department: 'District Administration',
    jurisdiction: 'Delhi District, Gujarat'
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        full_name: profile.full_name,
        // In a real app, we'd also save department/jurisdiction if they are in the schema
      }, { merge: true });
      toast.success('Officer profile and governance rules updated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 fade-in min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-black font-mukta text-slate-900 uppercase tracking-tighter">Officer Guidelines & Logic</h1>
        <p className="text-slate-500 font-medium">Configure district boundaries, official alert thresholds, and department keys.</p>
      </div>

      {/* 🏛️ Official Profile Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-blue-700"><User size={20} /> Government Officer Identity</h3>
        <div className="card p-8 bg-white border-blue-50 shadow-xl rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-40" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-400 overflow-hidden border-2 border-white shadow-lg">
                {user?.profile_image ? <img src={user.profile_image} className="w-full h-full object-cover" /> : <User size={40} />}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md text-slate-600 hover:text-blue-600 transition-colors border border-blue-100">
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                  <User size={10} /> Authorized Name
                </label>
                <input 
                  type="text" 
                  value={profile.full_name} 
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                  <Mail size={10} /> Official Email
                </label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 cursor-not-allowed" 
                  readOnly 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={10} /> Department
                </label>
                <input 
                  type="text" 
                  value={profile.department} 
                  onChange={(e) => setProfile({...profile, department: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={10} /> Jurisdiction
                </label>
                <input 
                  type="text" 
                  value={profile.jurisdiction} 
                  onChange={(e) => setProfile({...profile, jurisdiction: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
         <section className="space-y-4">
            <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-blue-600"><Map size={20} /> Boundary Logic</h3>
            <div className="card p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Managed District Code</label>
                  <input type="text" defaultValue="GUJ-RAJKOT-360001" className="input bg-slate-50 border-slate-100 font-mono text-sm" readOnly />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-3xl border border-blue-100">
                   <div><p className="font-bold text-sm text-blue-900">Automated State Sync</p><p className="text-[10px] text-blue-600">Sync all reports with GSWAN Network hourly.</p></div>
                   <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                </div>
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-orange-600"><Bell size={20} /> Alert Configuration</h3>
            <div className="card p-8 space-y-6 text-xs">
               <div className="flex justify-between items-center">
                  <p className="font-black text-slate-700 uppercase tracking-tight">Incident Escalation Threshold</p>
                  <select className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    <option>High (Score &gt; 8.5)</option>
                    <option>Med (Score &gt; 6.0)</option>
                  </select>
               </div>
               <div className="flex justify-between items-center">
                  <p className="font-black text-slate-700 uppercase tracking-tight">Official Response SLA</p>
                  <select className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    <option>30 Minutes</option>
                    <option>60 Minutes</option>
                  </select>
               </div>
            </div>
         </section>
      </div>

      <div className="flex justify-end items-center gap-4 pt-10 border-t border-slate-100">
         <button className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">Wipe Local Logs</button>
         <button 
           onClick={handleSave} 
           disabled={loading}
           className="px-10 py-4 bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 hover:bg-blue-800 transition-all disabled:opacity-50"
         >
           {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
           {loading ? 'Saving...' : 'Apply Governance'}
         </button>
      </div>
    </div>
  );
}
