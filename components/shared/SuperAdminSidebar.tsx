'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldAlert, Globe, Activity, Terminal, 
  Database, Zap, Lock, Settings, 
  Cpu, Radio, BarChart3, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const menuItems = [
    { id: 'nexus', label: 'Supreme Nexus', icon: ShieldAlert, href: '/admin/super' },
    { id: 'entities', label: 'Global Entities', icon: Database, href: '/admin/super/entities' },
    { id: 'telemetry', label: 'Live Telemetry', icon: Cpu, href: '/admin/super/telemetry' },
    { id: 'broadcast', label: 'Emergency Radio', icon: Radio, href: '/admin/super/broadcast' },
    { id: 'stats', label: 'Impact Analytics', icon: BarChart3, href: '/admin/super/stats' },
  ];

  return (
    <aside className="w-72 bg-[#0F172A] text-white flex flex-col border-r border-white/5 h-screen sticky top-0 z-[60]">
      {/* Brand */}
      <div className="p-8 border-b border-white/5 bg-[#1E293B]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black font-mukta tracking-tighter uppercase text-white">Sahaayak</h1>
            <p className="text-[9px] text-red-500 font-bold tracking-[0.2em] uppercase">Supreme Overseer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Governance Nodes</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-sm transition-all group ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`} />
              <span className={isActive ? 'text-white' : 'text-slate-200'}>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-6 border-t border-slate-800 space-y-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">System Integrity</span>
              <span className="text-[10px] font-bold text-emerald-500">100%</span>
           </div>
           <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
           </div>
        </div>
        
        <button 
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
        >
          <LogOut size={18} /> Disconnect Terminal
        </button>
      </div>
    </aside>
  );
}
