'use client';

/**
 * Partner organisations.
 *
 * This page used to list four invented NGOs in Delhi, Surat, Ahmedabad and
 * Baroda with fabricated health percentages. There is no separate organisation
 * registry in this build, so rather than invent one the page derives what is
 * actually knowable: which organisations have volunteers on the roster, and how
 * much referred work is open against them.
 *
 * Where a figure is not derivable it is left blank rather than filled in.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Users, Inbox, MapPin } from 'lucide-react';

interface Volunteer {
  id: string;
  name: string;
  organisation: string;
  ward: string | null;
  status: string;
  tasks_completed: number;
}

interface Need {
  id: string;
  assignment_type: string;
  status: string;
  category: string;
  urgency_score: number;
}

export default function PartnersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [referrals, setReferrals] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/volunteers').then((r) => (r.ok ? r.json() : { volunteers: [] })),
      fetch('/api/needs?assignment=ngo&limit=300').then((r) => (r.ok ? r.json() : { needs: [] })),
    ])
      .then(([v, n]) => {
        setVolunteers(v.volunteers ?? []);
        setReferrals(n.needs ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const organisations = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; volunteers: Volunteer[]; wards: Set<string>; closed: number }
    >();

    volunteers.forEach((v) => {
      const entry = byName.get(v.organisation) ?? {
        name: v.organisation,
        volunteers: [],
        wards: new Set<string>(),
        closed: 0,
      };
      entry.volunteers.push(v);
      if (v.ward) entry.wards.add(v.ward);
      entry.closed += v.tasks_completed;
      byName.set(v.organisation, entry);
    });

    return [...byName.values()].sort((a, b) => b.volunteers.length - a.volunteers.length);
  }, [volunteers]);

  const openReferrals = referrals.filter((r) => r.status !== 'completed' && r.status !== 'closed');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-mukta">Partner organisations</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Derived from the volunteer roster and referred work. There is no separate registry in
          this build.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Organisations</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{organisations.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Volunteers</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{volunteers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Open referrals</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{openReferrals.length}</p>
        </div>
      </div>

      {error && (
        <div className="bg-white border border-amber-300 rounded-2xl p-6">
          <p className="text-sm font-bold text-amber-700">Could not load partner data</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && organisations.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-slate-700">No organisations yet</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Seed the roster with <code className="text-slate-700">npm run seed:volunteers</code>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organisations.map((org) => (
          <div key={org.name} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Building2 size={16} />
                </span>
                <p className="font-bold text-slate-800 truncate">{org.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
              <div>
                <p className="text-lg font-black text-slate-800">{org.volunteers.length}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">People</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">{org.closed}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Closed</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">
                  {org.volunteers.filter((v) => v.status === 'available').length}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Free now</p>
              </div>
            </div>

            {org.wards.size > 0 && (
              <p className="text-[11px] text-slate-500 font-medium flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                <span>{[...org.wards].join(', ')}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {openReferrals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Inbox size={15} /> Work referred to partners
          </p>
          <div className="space-y-2">
            {openReferrals.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium truncate">
                  {(r as any).title ?? r.category}
                </span>
                <span className="shrink-0 font-bold text-slate-400">urgency {r.urgency_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
        <Users size={12} /> Verification status and compliance scoring are not implemented. Partner
        paperwork is reviewed on the compliance screen, which prepares a human reviewer&apos;s
        worklist rather than issuing a verdict.
      </p>
    </div>
  );
}
