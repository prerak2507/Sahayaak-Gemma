'use client';

/**
 * The audit trail.
 *
 * This page used to show four invented events: a TOTP login, a database
 * migration, a rate limit hit, and a task deployment, with made-up IP
 * addresses. None of it had ever happened.
 *
 * It now reads the real trail. Every change to a report is recorded against
 * that report with who made it, and every refusal at intake is recorded too,
 * so the list below is an account of what the system actually did.
 */

import React, { useEffect, useState } from 'react';
import { Activity, Clock, ShieldX, FilePlus2, UserCog, MapPin, RefreshCw } from 'lucide-react';

interface AuditEntry {
  at: string;
  kind: string;
  actor: string;
  detail: string;
  subject: string;
  subjectId: string;
}

const STYLES: Record<string, { icon: React.ReactNode; tone: string; label: string }> = {
  filed: { icon: <FilePlus2 size={14} />, tone: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Filed' },
  refused: { icon: <ShieldX size={14} />, tone: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Refused' },
  status: { icon: <Activity size={14} />, tone: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Status' },
  department: { icon: <UserCog size={14} />, tone: 'text-violet-600 bg-violet-50 border-violet-200', label: 'Rerouted' },
  crew: { icon: <UserCog size={14} />, tone: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Crew' },
  note: { icon: <Clock size={14} />, tone: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Note' },
  resolution: { icon: <Activity size={14} />, tone: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Resolved' },
  location: { icon: <MapPin size={14} />, tone: 'text-cyan-600 bg-cyan-50 border-cyan-200', label: 'Location' },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/audit?limit=150');
      if (!res.ok) throw new Error(`The audit trail returned ${res.status}`);
      const body = await res.json();
      setEntries(body.entries ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in min-h-screen">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-mukta">Audit trail</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Every change made to a report, and every report refused at intake.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400 font-semibold">
          Loading the trail
        </div>
      )}

      {error && !loading && (
        <div className="bg-white border border-amber-300 rounded-2xl p-6">
          <p className="text-sm font-bold text-amber-700">The audit trail could not be read</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-700">Nothing has happened yet</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            File a report, or change one, and it will appear here.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {entries.map((e, i) => {
            const style = STYLES[e.kind] ?? STYLES.note;
            return (
              <div key={`${e.subjectId}-${i}`} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${style.tone}`}
                >
                  {style.icon} {style.label}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{e.subject}</p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 break-words">{e.detail}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-bold text-slate-700">{e.actor}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{timeAgo(e.at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
