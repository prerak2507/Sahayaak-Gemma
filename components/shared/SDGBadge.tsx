'use client';

import { SDG_COLORS, SDG_NAMES } from '@/types';

export function SDGBadge({ sdg, size = 'small' }: { sdg: string; size?: 'small' | 'large' }) {
  const color = SDG_COLORS[sdg] || '#888';
  const name = SDG_NAMES[sdg] || sdg;
  const num = sdg.replace('SDG', '');
  const dim = size === 'large' ? 56 : 40;

  return (
    <div className="flex flex-col items-center gap-1" title={`${sdg}: ${name}`}>
      <div
        className="flex items-center justify-center rounded-lg font-bold text-white"
        style={{
          background: color,
          width: dim,
          height: dim,
          fontSize: size === 'large' ? 20 : 14,
          fontFamily: 'var(--font-mukta)',
        }}
      >
        {num}
      </div>
      {size === 'large' && (
        <span className="text-[10px] text-center font-medium" style={{ color: 'var(--ink-muted)', maxWidth: 64 }}>
          {name}
        </span>
      )}
    </div>
  );
}
