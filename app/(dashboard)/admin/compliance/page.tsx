'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  History, 
  FileWarning, 
  Activity, 
  Lock, 
  Eye, 
  Download, 
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search
} from 'lucide-react';
import { AuditLedger } from '@/components/shared/AuditLedger';

export default function CompliancePage() {
  const [complianceScore, setComplianceScore] = useState(94);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const runAiAudit = async () => {
    setIsAuditing(true);
    // Simulating call to new api/ai/compliance-audit
    setTimeout(() => {
      setAuditResult({
        score: 98,
        status: 'Optimal',
        gaps: ['2 minor encryption warnings in legacy nodes'],
        recommendation: 'Rotate regional node keys in Ward 4.'
      });
      setIsAuditing(false);
    }, 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full animate-pulse">Live Oversight</span>
            <span className="text-slate-400 text-xs font-bold font-mono">NODE_ID: SEVA-SOC-01</span>
          </div>
          <h1 className="text-4xl font-black font-mukta text-slate-900 tracking-tighter uppercase">
            Audit & Compliance <span className="text-slate-400 text-2xl font-light">SOC</span>
          </h1>
          <p className="text-slate-500 font-medium">Real-time governance and policy enforcement for the Sahaayak network.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={runAiAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            {isAuditing ? <RefreshCw className="animate-spin" size={16} /> : <Cpu size={16} />}
            {isAuditing ? 'Running AI Audit...' : 'Run L5 AI Audit'}
          </button>
          <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-white border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={48} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network Integrity</p>
          <p className="text-4xl font-black font-mukta text-slate-900">{complianceScore}%</p>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <div className="card bg-white border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Warnings</p>
          <p className="text-4xl font-black font-mukta text-red-600">02</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1">
            <AlertTriangle size={10} className="text-amber-500" /> Action Required in 48h
          </p>
        </div>

        <div className="card bg-white border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last AI Scan</p>
          <p className="text-4xl font-black font-mukta text-slate-900">14m <span className="text-lg font-normal text-slate-400">ago</span></p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2 flex items-center gap-1">
            <CheckCircle2 size={10} /> Status: Nominal
          </p>
        </div>

        <div className="card bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-2 -right-2 opacity-10"><Lock size={80} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Policy Status</p>
          <p className="text-xl font-bold font-mukta">STRICT_ENFORCE</p>
          <p className="text-[10px] font-medium text-slate-500 mt-2">All unauthorized node access blocked.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Policy and Audit Controls */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* AI Audit Result Panel (Conditional) */}
          {auditResult && (
            <div className="card bg-emerald-50 border-emerald-100 shadow-lg animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-black font-mukta text-lg text-emerald-900">L5 AI Audit Complete</h3>
                    <p className="text-xs text-emerald-700 font-medium">Platform verified as per Sahaayak v2.1 Standards.</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="p-4 bg-white/50 rounded-2xl border border-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Findings</p>
                    <ul className="text-sm text-emerald-900 space-y-1">
                      {auditResult.gaps.map((gap: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">• {gap}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">AI Recommendation</p>
                    <p className="text-sm font-bold">{auditResult.recommendation}</p>
                  </div>
               </div>
            </div>
          )}

          {/* System Policy Control */}
          <div className="card bg-white border-slate-100 shadow-sm p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-black font-mukta text-xl text-slate-900 uppercase">Policy Enforcement</h3>
              <History size={18} className="text-slate-400" />
            </div>
            <div className="p-6 space-y-6">
              {[
                { title: 'Biometric Multi-Factor Auth', desc: 'Enforce fingerprint/face verification for all admins.', active: true },
                { title: 'Automatic Node Suspension', desc: 'Auto-disable NGOs with >3 low-quality reports.', active: true },
                { title: 'Data Encryption (AES-256)', desc: 'Encrypt all sensitive community data at rest.', active: true },
                { title: 'L5 Autonomous Oversight', desc: 'Allow AI to intervene in critical life-safety dispatch.', active: false }
              ].map((policy, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="max-w-md">
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{policy.title}</p>
                    <p className="text-xs text-slate-500 font-medium">{policy.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-all relative ${policy.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${policy.active ? 'left-7 shadow-sm' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Log Table */}
          <div className="card bg-white border-slate-100 shadow-sm p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black font-mukta text-xl text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FileWarning size={20} className="text-amber-500" /> Compliance Log
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-200" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Event Description</th>
                    <th className="px-6 py-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                   <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">14:22:01</td>
                      <td className="px-6 py-4 font-black text-slate-900">AUTH_GATEWAY</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">System Admin access granted via L3 bypass code.</td>
                      <td className="px-6 py-4 text-right"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black text-[8px] uppercase">Normal</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">14:28:44</td>
                      <td className="px-6 py-4 font-black text-slate-900">NODE_RAJKOT</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">Multiple failed CSRF attempts detected on Ward 4 endpoint.</td>
                      <td className="px-6 py-4 text-right"><span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-black text-[8px] uppercase tracking-widest">High</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">14:35:12</td>
                      <td className="px-6 py-4 font-black text-slate-900">SARVAM_AI</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">Encryption handshake verified for Gujarati speech node.</td>
                      <td className="px-6 py-4 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-black text-[8px] uppercase">Secure</span></td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Audit Ledger Component */}
        <div className="lg:col-span-5 flex flex-col h-[850px]">
           <AuditLedger />
           <div className="mt-6 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-all">
                <Eye size={64} />
              </div>
              <h4 className="font-black font-mukta text-lg uppercase tracking-tight mb-2">Shadow Oversight</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                The L5 Audit protocol monitors all admin actions silently. Any deviation from Sahaayak governance standards triggers an immediate network-wide freeze of the affected node.
              </p>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900" />)}
                 </div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3 Monitors Active</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
