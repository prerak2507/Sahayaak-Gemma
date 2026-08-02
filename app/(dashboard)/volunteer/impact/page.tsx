'use client';

import { useAuthStore } from '@/stores/authStore';
import { Award, Download, Share2, Star, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VolunteerImpact() {
  const { user } = useAuthStore();

  const handleDownloadPdf = () => {
    toast.success('Generating impact certificate...');
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleShare = () => {
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mukta mb-2 text-[var(--ink)]">Your Impact Report</h1>
        <p className="text-[var(--ink-muted)]">Track your contribution to the community and UN Sustainable Development Goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Certificate View */}
        <div id="certificate-print-area" className="bg-white p-8 rounded-2xl border-4 border-double border-[var(--border-strong)] shadow-lg relative overflow-hidden flex flex-col items-center justify-center text-center outline outline-1 outline-[var(--border)] min-h-[500px]">
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[var(--saffron)] opacity-50" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[var(--saffron)] opacity-50" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[var(--saffron)] opacity-50" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[var(--saffron)] opacity-50" />

          <div className="w-20 h-20 bg-[var(--saffron-light)] rounded-full flex items-center justify-center mb-6 text-[var(--saffron)] ring-4 ring-[var(--saffron-glow)]">
            <Award size={40} />
          </div>

          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-4">Certificate of Impact</h3>
          
          <h2 className="text-4xl font-serif font-bold text-[var(--ink)] mb-6 whitespace-nowrap">
            {user?.full_name || 'Field Engineer User'}
          </h2>

          <p className="text-[var(--ink-muted)] px-8 mb-8 leading-relaxed max-w-sm">
            In recognition of outstanding dedication and service to the community through the Sahaayak platform.
          </p>

          <div className="flex gap-8 mb-8 border-y border-[var(--border)] py-4 w-full justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold font-mukta text-[var(--saffron)]">18</p>
              <p className="text-[10px] uppercase font-bold text-[var(--ink-faint)]">Tasks Resolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mukta text-[var(--saffron)]">42h</p>
              <p className="text-[10px] uppercase font-bold text-[var(--ink-faint)]">Hours Served</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mukta text-[var(--saffron)]">4.8</p>
              <p className="text-[10px] uppercase font-bold text-[var(--ink-faint)]">Avg Rating</p>
            </div>
          </div>

          <div className="mt-auto flex justify-center gap-6 opacity-30 print:opacity-100">
            <div className="text-center">
              <div className="w-32 border-b border-black mb-1"></div>
              <p className="text-[10px] italic">Platform Verification</p>
            </div>
            <div className="text-center">
              <p className="font-bold font-mukta text-lg leading-none">Sahaayak</p>
              <p className="text-[10px] italic">Sahaayak System</p>
            </div>
          </div>
        </div>

        {/* Controls & Breakdown */}
        <div className="space-y-6 print:hidden">
          <div className="card flex gap-4">
            <button onClick={handleDownloadPdf} className="btn-primary flex-1 justify-center">
              <Download size={18} /> Download PDF
            </button>
            <button onClick={handleShare} className="btn-ghost flex-1 justify-center border border-[var(--border)]">
              <Share2 size={18} /> Share Profile
            </button>
          </div>

          <div className="card">
            <h3 className="font-bold font-mukta text-lg mb-4 flex items-center gap-2"><Target size={18} className="text-[var(--saffron)]" /> SDG Impact Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>SDG 3: Good Health</span>
                  <span>12 hrs</span>
                </div>
                <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>SDG 11: Sustainable Cities</span>
                  <span>8 hrs</span>
                </div>
                <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full" style={{ width: '25%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>SDG 2: Zero Hunger</span>
                  <span>22 hrs</span>
                </div>
                <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-[var(--surface-2)]">
            <h3 className="font-bold font-mukta text-lg mb-4 flex items-center gap-2"><Zap size={18} className="text-indigo-500" /> Recent Activity Log</h3>
            <ul className="space-y-4 text-sm relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
              <li className="relative pl-6">
                <div className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--saffron)]" />
                <p className="font-bold">Distributed emergency food supplies</p>
                <p className="text-[var(--ink-muted)] text-xs mt-1">4.5 hrs • Sanjeevani Relief • SDG2</p>
              </li>
              <li className="relative pl-6">
                <div className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
                <p className="font-bold text-[var(--ink-muted)]">Completed medical triage training</p>
                <p className="text-[var(--ink-faint)] text-xs mt-1">2 hrs • Verified by Admin</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #certificate-print-area, #certificate-print-area * { visibility: visible; }
          #certificate-print-area { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; border: none; box-shadow: none; }
        }
      `}} />
    </div>
  );
}
