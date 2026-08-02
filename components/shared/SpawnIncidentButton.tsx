'use client';

/**
 * Ask Gemma to file a new incident.
 *
 * This is a demo control, and it is honest about being one. It does not inject
 * a canned record: Gemma writes a resident's complaint in Gujarati, Hindi or
 * English, and that text then goes through the same intake pipeline as a real
 * submission, which has no idea it was generated. The routing, urgency, crew
 * and location that come back are decided live.
 *
 * Press it twice and you get two different incidents, because the model is
 * writing them rather than replaying a list.
 */

import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SpawnResult {
  text: string;
  language: string;
  department: string;
  urgency: number;
  toolCalled: string | null;
  worker: { name: string; title: string } | null;
  location: { name: string } | null;
  needs_location_pin: boolean;
  latencyMs: number;
  model: string;
}

export function SpawnIncidentButton({ onSpawned }: { onSpawned?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<SpawnResult | null>(null);

  const spawn = async (severity: 'normal' | 'emergency') => {
    setBusy(true);
    setLast(null);

    const toastId = toast.loading(
      severity === 'emergency'
        ? 'Gemma is writing an emergency report'
        : 'Gemma is writing a resident report'
    );

    try {
      const res = await fetch('/api/dev/spawn-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.userMessage || data.reason || 'Gemma could not file that one.', { id: toastId });
        return;
      }

      setLast(data);
      toast.success(
        `Filed: ${data.department}, urgency ${data.urgency}, in ${(data.latencyMs / 1000).toFixed(1)}s`,
        { id: toastId }
      );
      onSpawned?.();
    } catch (error) {
      toast.error('The incident could not be filed.', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => spawn('normal')}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Have Gemma file a report
        </button>

        <button
          onClick={() => spawn('emergency')}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          <AlertTriangle size={14} />
          File an emergency
        </button>
      </div>

      <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-md">
        Gemma writes the resident&apos;s sentence, then the ordinary intake pipeline reads it and
        decides everything else. Nothing here is pre-written.
      </p>

      {last && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 max-w-md">
          <p className="text-xs text-slate-800 font-semibold leading-relaxed">&ldquo;{last.text}&rdquo;</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200">
            <span>lang {last.language}</span>
            <span>{String(last.department).replace(/_/g, ' ')}</span>
            <span>urgency {last.urgency}</span>
            {last.toolCalled && <span>{last.toolCalled.replace(/_/g, ' ')}</span>}
            {last.location && <span>{last.location.name}</span>}
            {last.needs_location_pin && <span className="text-amber-600">needs a pin</span>}
          </div>
          {last.worker && (
            <p className="text-[10px] text-slate-500 font-medium">
              Crew: {last.worker.name}, {last.worker.title}
            </p>
          )}
          <p className="text-[10px] text-slate-400 font-medium">
            {last.model} · {(last.latencyMs / 1000).toFixed(1)}s
          </p>
        </div>
      )}
    </div>
  );
}
