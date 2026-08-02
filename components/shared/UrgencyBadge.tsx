'use client';

import { getUrgencyLabel } from '@/lib/utils';

export function UrgencyBadge({ score }: { score: number }) {
  const label = getUrgencyLabel(score);

  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Critical: { bg: 'var(--critical-light)', color: 'var(--critical)', border: '#FECACA' },
    High: { bg: 'var(--high-light)', color: 'var(--high)', border: '#FED7AA' },
    Medium: { bg: 'var(--medium-light)', color: 'var(--medium)', border: '#FDE68A' },
    Low: { bg: 'var(--low-light)', color: 'var(--low)', border: '#BBF7D0' },
  };

  const s = styles[label];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${label === 'Critical' ? 'critical-pulse' : ''}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {score.toFixed(1)} · {label}
    </span>
  );
}
