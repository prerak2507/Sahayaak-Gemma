'use client';

/**
 * The people on the platform.
 *
 * This page used to list four invented users with made-up karma scores in
 * Delhi, Surat, Ahmedabad and Baroda. It now reads the real volunteer roster,
 * and the status control writes back, so a coordinator can actually mark
 * somebody unavailable and have it stick.
 */

import React, { useEffect, useState } from 'react';
import { Search, Shield, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateVolunteer } from '@/lib/data/mutate-need';

interface Volunteer {
  id: string;
  name: string;
  organisation: string;
  ward: string | null;
  status: string;
  skills: string[];
  languages: string[];
  hours: number;
  tasks_completed: number;
  rating: number | null;
}

const STATUS_TONE: Record<string, string> = {
  available: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  busy: 'text-amber-700 bg-amber-50 border-amber-200',
  on_break: 'text-slate-600 bg-slate-100 border-slate-200',
  offline: 'text-slate-500 bg-slate-50 border-slate-200',
};

export default function UsersPage() {
  const [people, setPeople] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/volunteers');
      if (!res.ok) throw new Error(`The roster returned ${res.status}`);
      const body = await res.json();
      setPeople(body.volunteers ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id: string, status: string) => {
    setSaving(id);
    try {
      await updateVolunteer(id, { status });
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      toast.success('Saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That change was not saved.');
    } finally {
      setSaving(null);
    }
  };

  const shown = people.filter(
    (p) =>
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.organisation.toLowerCase().includes(query.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-mukta">People</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {loading ? 'Loading' : `${people.length} volunteers across Rajkot`}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, organisation or skill"
            className="pl-9 pr-4 py-2.5 w-full md:w-72 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-800/10"
          />
        </div>
      </div>

      {error && (
        <div className="bg-white border border-amber-300 rounded-2xl p-6">
          <p className="text-sm font-bold text-amber-700">The roster could not be read</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && people.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-700">No volunteers yet</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Seed the roster with <code className="text-slate-700">npm run seed:volunteers</code>
          </p>
        </div>
      )}

      {shown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {shown.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 truncate">{p.name}</p>
                  {p.rating !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                      <Star size={11} fill="currentColor" /> {p.rating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {p.organisation} · {p.ward ?? 'no ward'} · {p.tasks_completed} closed · {p.hours}h
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                  {p.skills.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                    STATUS_TONE[p.status] ?? STATUS_TONE.offline
                  }`}
                >
                  {p.status.replace('_', ' ')}
                </span>

                <select
                  value={p.status}
                  disabled={saving === p.id}
                  onChange={(e) => changeStatus(p.id, e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 outline-none disabled:opacity-50"
                >
                  <option value="available">available</option>
                  <option value="busy">busy</option>
                  <option value="on_break">on break</option>
                  <option value="offline">offline</option>
                </select>

                {saving === p.id && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
        <Shield size={12} /> Status changes save immediately and survive a reload.
      </p>
    </div>
  );
}
