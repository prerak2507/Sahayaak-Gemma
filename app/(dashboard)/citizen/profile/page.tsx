'use client';
import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, ShieldCheck, MapPin, Phone, Mail, Award, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitizenProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 font-mukta">Citizen Profile</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage your identity verification and local ward settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Identity Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-indigo-600" />
            
            <div className="relative z-10 w-24 h-24 mx-auto bg-white rounded-full p-1.5 shadow-xl mb-4 mt-8">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User size={40} />
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">{user?.full_name || 'Verified Citizen'}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={12} /> KYC Verified
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-[2rem] p-6 text-center shadow-inner">
            <Award size={32} className="text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-amber-900 text-lg">Community Trust Score</h3>
            <div className="text-3xl font-black text-amber-600 font-mukta mt-2">94%</div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700/70 mt-2">High Authenticity Tier</p>
          </div>
        </div>

        {/* Right Column: Details & Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" /> Personal Identity Records
            </h3>

            <div className="space-y-5">
              <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Phone size={12}/> Registered Mobile</label>
                <div className="font-bold text-slate-700">{user?.phone || '+91 75750 63381'}</div>
              </div>

              <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><MapPin size={12}/> Default Reporting Ward</label>
                <div className="font-bold text-slate-700">Ward 14, Central Zone</div>
              </div>

              <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Mail size={12}/> Notification Email</label>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-slate-500 italic">Not Linked</div>
                  <button onClick={() => toast.success('Link sent to email!')} className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    Link Email
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button onClick={() => toast.success('DigiLocker sync initiated!')} className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Re-Sync with DigiLocker
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
