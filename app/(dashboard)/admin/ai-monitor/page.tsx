'use client';

import { useState, useEffect } from 'react';
import { Bot, AlertCircle, CheckCircle2, Search, Filter, Sparkles, XCircle, Zap, ShieldAlert, Cpu, Activity } from 'lucide-react';

export default function AiMonitor() {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'low_confidence'>('all');
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [health, setHealth] = useState({
    gemma: 'operational',
    sarvam: 'operational',
    safety: 'operational'
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Initial Logs
    const initialLogs = [
      {
        id: 'AI-4859',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        action: 'Content Moderation',
        input: 'Urgent help required at slum area, building collapsed...',
        result: 'PASSED',
        confidence: 0.98,
        flagged: false,
        model: 'gemma4:e4b-it-qat',
        latency: '240ms'
      },
      {
        id: 'AI-4858',
        timestamp: new Date(Date.now() - 42000).toISOString(),
        action: 'Urgency Scoring',
        input: 'Need 5 volunteers for teaching kids on weekend',
        result: 'SCORE: 3.2',
        confidence: 0.95,
        flagged: false,
        model: 'gemma4:e4b-it-qat',
        latency: '450ms'
      },
      {
        id: 'AI-4857',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        action: 'Content Moderation',
        input: 'We demand government cash immediately or we will protest violently at MG Road.',
        result: 'FAILED (Violence/Hate)',
        confidence: 0.99,
        flagged: true,
        model: 'gemma4:e4b-it-qat',
        latency: '180ms'
      },
      {
        id: 'AI-4856',
        timestamp: new Date(Date.now() - 360000).toISOString(),
        action: 'Speech-to-Text',
        input: '[Audio Blob - GUJ]',
        result: 'મને તાત્કાલિક દવાની જરૂર છે',
        confidence: 0.65,
        flagged: false,
        model: 'sarvam-stt',
        latency: '1.2s'
      }
    ];
    setLogs(initialLogs);

    // Simulate Live Activity
    const interval = setInterval(() => {
      const actions = ['Safety Audit', 'Translation', 'Urgency Index', 'Metadata Extraction'];
      const models = ['gemma4:e4b-it-qat', 'gemma4:e2b-it-qat', 'gemma4:cloud'];
      const newLog = {
        id: `AI-${Math.floor(4860 + Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        action: actions[Math.floor(Math.random() * actions.length)],
        input: 'Processing live telemetry stream...',
        result: 'SUCCESS_STABLE',
        confidence: 0.85 + Math.random() * 0.14,
        flagged: Math.random() > 0.95,
        model: models[Math.floor(Math.random() * models.length)],
        latency: `${Math.floor(100 + Math.random() * 800)}ms`
      };
      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return l.flagged;
    if (filter === 'low_confidence') return l.confidence < 0.8;
    return true;
  });

  return (
    <div className="h-full flex flex-col space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-mukta text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
            <Cpu className="text-blue-600" /> AI Systems Oversight
          </h1>
          <p className="text-slate-500 font-medium">Live telemetry from the Gemma reasoning layer and the speech edges.</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Activity size={14} className="animate-pulse" /> Live Feed Active
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={40} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Throughput</p>
          <p className="text-3xl font-bold font-mukta text-slate-900">42.8k <span className="text-xs font-normal text-slate-400">ops/hr</span></p>
          <div className="mt-3 flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-bold text-slate-500 uppercase">Optimal Flow</span>
          </div>
        </div>

        <div className="card bg-white border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety Interventions</p>
          <p className="text-3xl font-bold font-mukta text-red-600">128</p>
          <div className="mt-3 flex items-center gap-1.5">
             <ShieldAlert size={12} className="text-red-500" />
             <span className="text-[9px] font-bold text-slate-500 uppercase">Malicious Content Blocked</span>
          </div>
        </div>

        <div className="card bg-slate-900 text-white border-none shadow-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sarvam Translation Latency</p>
          <p className="text-3xl font-bold font-mukta">412ms</p>
          <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-blue-400 w-[65%]" />
          </div>
        </div>

        <div className="card bg-white border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gemma node confidence</p>
          <p className="text-3xl font-bold font-mukta text-emerald-600">97.4%</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">Aggregate Reliability</p>
        </div>
      </div>

      <div className="card flex-1 flex flex-col p-0 overflow-hidden bg-white border-slate-200 shadow-xl rounded-[2rem]">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Global Logs', color: 'bg-white' },
              { id: 'flagged', label: 'Safety Violations', color: 'bg-red-50 text-red-600' },
              { id: 'low_confidence', label: 'Low Confidence', color: 'bg-orange-50 text-orange-600' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === tab.id ? `${tab.color} shadow-md` : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Filter Request Hash..." className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs w-64 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Request Trace</th>
                <th className="px-6 py-4">Intelligence Node</th>
                <th className="px-6 py-4">Telemetry Payload</th>
                <th className="px-6 py-4">Output Vector</th>
                <th className="px-6 py-4 text-right">Reliability</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-blue-600">{log.id}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      {isMounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{log.action}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                       <Zap size={10} className="text-yellow-500" /> {log.model}
                    </p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="bg-slate-100 p-2 rounded-lg text-[10px] font-mono text-slate-600 line-clamp-1 group-hover:line-clamp-none transition-all">
                       {log.input}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      log.flagged ? 'bg-red-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {log.flagged ? <ShieldAlert size={10} /> : <CheckCircle2 size={10} />}
                      {log.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`font-black font-mukta text-sm ${log.confidence < 0.8 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {(log.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{log.latency}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
