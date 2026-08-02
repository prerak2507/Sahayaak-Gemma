'use client';
import React from 'react';
import { Save, Bell, Globe, Cog, Shield, Database, Smartphone, HardDrive, User, Mail, Briefcase, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 fade-in min-h-screen pb-20">
      <div><h1 className="text-3xl font-bold font-mukta text-[var(--ink)]">Core Governance Rules</h1><p className="text-[var(--ink-muted)]">Configure global thresholds, API integrations, and system-wide policies.</p></div>

      {/* 👤 User Profile Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-slate-700"><User size={20} /> Administrator Profile</h3>
        <div className="card p-8 bg-white border-slate-100 shadow-xl rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -mr-10 -mt-10" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-white shadow-lg">
                {user?.profile_image ? <img src={user.profile_image} className="w-full h-full object-cover" /> : <User size={40} />}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md text-slate-600 hover:text-blue-600 transition-colors border border-slate-100">
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={10} /> Full Name
                </label>
                <input type="text" defaultValue={user?.full_name ?? ""} className="input-minimal text-lg font-bold p-0 border-none bg-transparent focus:ring-0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Mail size={10} /> Email Endpoint
                </label>
                <input type="email" defaultValue={user?.email ?? ""} className="input-minimal text-sm font-medium p-0 border-none bg-transparent focus:ring-0 text-slate-600" readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={10} /> Responsibility
                </label>
                <input type="text" defaultValue="Platform Super Admin" className="input-minimal text-sm font-medium p-0 border-none bg-transparent focus:ring-0 text-slate-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={10} /> HQ Location
                </label>
                <input type="text" defaultValue="Delhi Central Hub" className="input-minimal text-sm font-medium p-0 border-none bg-transparent focus:ring-0 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
         <section className="space-y-4">
            <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-[var(--saffron)]"><Shield size={20} /> Integrity Constraints</h3>
            <div className="card p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-3xl">
                   <div><p className="font-bold text-sm">Force Critical-Only Dispatch</p><p className="text-[10px] text-gray-500">Auto-assign volunteers only when Urgency Score &gt; 8.5</p></div>
                   <div className="w-12 h-6 bg-[var(--saffron)] rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                </div>
                <div><label className="label">Monthly NGO Report Quota</label><input type="range" className="w-full accent-[var(--saffron)]" defaultValue="80" /><div className="flex justify-between text-[10px] text-gray-600 font-bold mt-2"><span>10 reports</span><span>UPPER LIMIT: 500 reports</span></div></div>
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-lg font-bold font-mukta flex items-center gap-2 text-indigo-600"><Database size={20} /> Infrastructure Hooks</h3>
            <div className="card p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="label">Firebase Project ID</label><input type="text" defaultValue="sahaayak-platform-prod" className="input" /></div>
                  <div><label className="label">GIS Maps Direction Key</label><input type="password" defaultValue="pk_test_42A8F9..." className="input" /></div>
               </div>
               <div><label className="label">Global Webhook for Disaster Alerts (JSON)</label><input type="text" defaultValue="https://safety-api.gov.in/v1/ingest/sahaayak" className="input" /></div>
            </div>
         </section>
      </div>

      <div className="flex justify-end items-center gap-4 pt-10 border-t">
         <button className="text-xs font-bold text-gray-600 hover:text-red-500 transition-colors">Emergency System Reset</button>
         <button onClick={() => toast.success('Platform rules updated globally!')} className="px-10 py-4 bg-[var(--ink)] text-white rounded-2xl font-bold shadow-2xl flex items-center gap-2"><Save size={18} /> Deploy Changes</button>
      </div>
    </div>
  );
}
