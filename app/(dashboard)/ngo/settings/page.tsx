'use client';

import React, { useState } from 'react';
import { User, Mail, Briefcase, Heart, Camera, Settings, Globe, ShieldAlert, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export default function NgoSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    designation: 'Operations Lead',
    focus: 'Disaster Relief & Food Security'
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        full_name: profile.full_name,
        // Optional: save other metadata fields
      });
      toast.success('NGO settings and coordinator identity synced!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update NGO settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 fade-in min-h-screen pb-20">
      <div>
        <h1 className="text-3xl font-black font-mukta text-slate-900 uppercase tracking-tighter">NGO Command Settings</h1>
        <p className="text-slate-500 font-medium">Manage institutional credentials and coordinator identity.</p>
      </div>

      {/* 🤝 NGO Coordinator Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-[var(--saffron)]"><User size={20} /> Coordinator Identity</h3>
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
             <Globe size={12} /> Publicly Visible
           </div>
        </div>
        
        <div className="card p-8 bg-white border-slate-100 shadow-xl rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--saffron-light)] rounded-bl-[100px] -mr-10 -mt-10 opacity-50" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-white shadow-lg">
                {user?.profile_image ? <img src={user.profile_image} className="w-full h-full object-cover" /> : <User size={40} />}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md text-slate-600 hover:text-[var(--saffron)] transition-colors border border-slate-100">
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={10} /> Coordinator Name
                </label>
                <input 
                  type="text" 
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--saffron)] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={10} /> Role / Designation
                </label>
                <input 
                  type="text" 
                  value={profile.designation}
                  onChange={(e) => setProfile({...profile, designation: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[var(--saffron)] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Heart size={10} /> Primary Focus
                </label>
                <input 
                  type="text" 
                  value={profile.focus}
                  onChange={(e) => setProfile({...profile, focus: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[var(--saffron)] outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏢 Institutional Details */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-slate-700"><Settings size={20} /> Institutional Credentials</h3>
        <div className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Name</label>
              <input type="text" defaultValue="Disha Foundation" readOnly className="input bg-slate-50 border-slate-100 font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Govt Registration (FCRA/Trust)</label>
              <input type="text" defaultValue="REG-94827-GJ" readOnly className="input bg-slate-50 border-slate-100 font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification Email Hub</label>
            <input type="text" defaultValue="admin@disha.org, alerts@disha.org" className="input" />
          </div>
        </div>
      </section>

      {/* ⚠️ Danger Zone */}
      <section className="pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100">
          <div>
            <h4 className="text-sm font-black text-red-900 uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert size={16} /> Operational Suspension
            </h4>
            <p className="text-xs text-red-700 font-medium mt-1">Deactivating the NGO account will freeze all active missions and volunteer assignments.</p>
          </div>
          <button className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
            Deactivate Hub
          </button>
        </div>
      </section>

      <div className="flex justify-end pt-6">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? 'Saving...' : 'Update Command'}
        </button>
      </div>
    </div>
  );
}
