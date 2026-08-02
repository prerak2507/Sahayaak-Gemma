'use client';

import { CATEGORY_COLORS, CATEGORY_LABELS, type NeedCategory } from '@/types';

export function CategoryBadge({ category }: { category: NeedCategory }) {
  const color = CATEGORY_COLORS[category] || '#64748b';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
