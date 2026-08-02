'use client';

import { AuditLedger } from '@/components/shared/AuditLedger';
import { Cpu, Activity, Zap, ShieldAlert } from 'lucide-react';

export default function TelemetryPage() {
  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-mukta text-slate-900 tracking-tighter">System Telemetry</h1>
          <p className="text-slate-500 font-medium">Deep packet inspection and real-time ledger auditing.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-200">
              <Activity size={14} className="animate-pulse" />
              Latency: 14ms
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-gradient-to-br from-white to-blue-50 text-slate-900 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100">
              <Cpu className="text-blue-500 mb-4" size={32} />
              <h3 className="text-xl font-black font-mukta mb-1 text-slate-900">Neural Processing</h3>
              <p className="text-slate-500 text-sm mb-6">AI Audit Engine load at optimal capacity.</p>
              <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                 <div className="bg-blue-600 h-full w-[12%]" />
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <Zap className="text-amber-500 mb-4" size={32} />
              <h3 className="text-xl font-black font-mukta mb-1 text-slate-900">Uptime Metric</h3>
              <p className="text-slate-500 text-sm mb-6">Continuous service delivery status.</p>
              <h4 className="text-4xl font-black text-slate-900">100.00%</h4>
           </div>

           <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] text-center">
              <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
              <h3 className="text-lg font-black text-red-900 mb-2 uppercase">Integrity Status</h3>
              <p className="text-red-700 text-sm font-medium">No unauthorized access detected in the last 24,000 cycles.</p>
           </div>
        </div>

        <div className="lg:col-span-8 h-[800px]">
          <AuditLedger />
        </div>
      </div>
    </div>
  );
}
