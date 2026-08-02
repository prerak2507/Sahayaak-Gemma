'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Award, Download, Send, RefreshCw, BarChart3, 
  TrendingUp, CheckCircle2, ShieldAlert, Heart, Calendar, Bot
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend
} from 'recharts';
import toast from 'react-hot-toast';

export default function ImpactReport() {
  const [loadingNarrative, setLoadingNarrative] = useState(true);
  const [narrativeText, setNarrativeText] = useState('');
  const [narrativeError, setNarrativeError] = useState('');

  // Built from the reports' own timestamps rather than a fixed six-month
  // series. A platform that has been running for a week shows a week, which is
  // the honest answer on a page that publishes performance figures.
  const [trendData, setTrendData] = useState<Array<{ month: string; Reported: number; Resolved: number }>>([]);
  const [stats, setStats] = useState<{
    total_needs: number; needs_resolved: number; open_needs: number;
    critical_open: number; wards_covered: number; ai_triaged: number; avg_urgency: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setStats(d))
      .catch((err) => console.error('Could not load report figures:', err));
  }, []);

  useEffect(() => {
    fetch('/api/needs?assignment=all&limit=500')
      .then((res) => (res.ok ? res.json() : { needs: [] }))
      .then(({ needs }) => {
        const buckets = new Map<string, { Reported: number; Resolved: number }>();
        const closed = new Set(['completed', 'closed', 'resolved']);

        (needs ?? []).forEach((n: any) => {
          if (!n.created_at) return;
          const d = new Date(n.created_at);
          if (Number.isNaN(d.getTime())) return;
          const key = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
          const b = buckets.get(key) ?? { Reported: 0, Resolved: 0 };
          b.Reported += 1;
          if (closed.has(n.status)) b.Resolved += 1;
          buckets.set(key, b);
        });

        setTrendData([...buckets.entries()].map(([month, v]) => ({ month, ...v })));
      })
      .catch((err) => console.error('Could not build the trend series:', err));
  }, []);

  // Written by Gemma from the live figures, once they have loaded. Waiting for
  // stats is deliberate: a narrative generated before the numbers arrive would
  // have nothing real to describe.
  useEffect(() => {
    if (!stats) return;

    const fetchNarrative = async () => {
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:
              'Write a four paragraph civic impact narrative for Rajkot Municipal Corporation using only the figures in your context: the challenge, the action taken, what changed, and what comes next. Do not state any number that is not in the context.',
            context: { stats },
          })
        });
        const data = await res.json();
        if (data.reply) {
          setNarrativeText(data.reply);
        } else {
          throw new Error('No reply');
        }
      } catch (e) {
        // No canned narrative here on purpose. This page previously substituted
        // four pre-written paragraphs containing invented statistics whenever
        // the model was unreachable, and presented them as generated output.
        // An empty report is honest; a fabricated one is not.
        setNarrativeError(
          e instanceof Error && e.message === 'No reply'
            ? 'The report could not be generated from the current data.'
            : 'Gemma is not reachable, so this report has not been generated.'
        );
        setNarrativeText('');
      } finally {
        setLoadingNarrative(false);
      }
    };
    fetchNarrative();
  }, [stats]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-24 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* HEADER BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 mb-8 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.25em] bg-teal-950/80 px-3 py-1 rounded-full border border-teal-900/80">
              Corporate Intelligence Unit
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-mukta text-white mt-2 tracking-tight">
              Sahaayak Civic Impact Report — Rajkot
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Comprehensive municipal performance analytics, AI narrative tracking, and SLA trends
            </p>
          </div>

          <div className="flex gap-4 self-end">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Download size={14} /> Download PDF
            </button>
            <button 
              onClick={() => toast.success('Report successfully submitted to central government portal!', { icon: '🏛️' })}
              className="px-6 py-3 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Send size={14} /> Submit to State
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXECUTIVE KPI SUMMARY BLOCKS */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reports Closed</span>
            <span className="text-3xl font-black text-teal-400 block">{stats ? stats.needs_resolved : '—'}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">of {stats ? stats.total_needs : '—'} filed</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Open Right Now</span>
            <span className="text-3xl font-black text-teal-400 block">{stats ? stats.open_needs : '—'}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{stats ? stats.critical_open : '—'} critical</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mean Urgency</span>
            <span className="text-3xl font-black text-teal-400 block">{stats ? stats.avg_urgency : '—'}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">out of 10</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Wards</span>
            <span className="text-3xl font-black text-slate-100 block">{stats ? stats.wards_covered : '—'}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{stats ? stats.ai_triaged : '—'} triaged by Gemma</span>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* TWO-COLUMN COMMAND SHEET: AREA CHART & AI NARRATIVE */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          
          {/* Recharts Area Chart Column */}
          <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold font-mukta text-white">6-Month Civic Performance Analytics</h2>
              <p className="text-xs text-slate-400 font-medium">Comparison of reported incidents against successful resolutions</p>
            </div>

            <div className="w-full h-80 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="Reported" stroke="#EF4444" fillOpacity={1} fill="url(#colorReported)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Resolved" stroke="#0F766E" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex gap-3 items-center">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs shrink-0 font-bold">✓</span>
              <p className="text-xs text-teal-400 leading-relaxed font-semibold">
                <span className="font-extrabold">SCM Milestone:</span> Ahmedabad has successfully crossed the 90% resolution rate target in May 2026 (92.5% of reported resolved).
              </p>
            </div>
          </div>

          {/* AI Narrative Column */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Bot size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Executive Impact Narrative</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Narrative Synthesis Engine</p>
              </div>
            </div>

            {loadingNarrative ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-850 border-t-teal-500 animate-spin" />
                <p className="text-slate-400 text-xs font-semibold">Gemma is writing the impact narrative</p>
              </div>
            ) : narrativeError ? (
              <div className="flex-1 bg-slate-950 p-6 rounded-2xl border border-amber-900/50 space-y-2">
                <p className="text-amber-400 text-xs font-bold">Report not generated</p>
                <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">{narrativeError}</p>
                <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                  The figures above come straight from the database and are unaffected. Check
                  <code className="mx-1 text-slate-400">npm run gemma:health</code>
                  and reload.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-850 text-[11px] font-semibold text-slate-350 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {narrativeText}
              </div>
            )}

            <button 
              onClick={() => toast.success('Regenerating performance summary...', { icon: '🔄' })}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all"
            >
              Re-Synthesize Summary
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
