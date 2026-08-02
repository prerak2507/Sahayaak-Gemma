'use client';

import { Need } from '@/types';
import { UrgencyBadge } from './UrgencyBadge';
import { CategoryBadge } from './CategoryBadge';
import { timeAgo } from '@/lib/utils';
import { MapPin, Clock, Users } from 'lucide-react';

interface NeedCardProps {
  need: Need;
  compact?: boolean;
  onAccept?: () => void;
  onClick?: () => void;
  distance?: number;
}

export function NeedCard({ need, compact, onAccept, onClick, distance }: NeedCardProps) {
  if (compact) {
    return (
      <div
        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/50"
        style={{ border: '1px solid var(--border)' }}
        onClick={onClick}
      >
        <div
          className="w-2 h-2 rounded-full mt-2 shrink-0"
          style={{ background: need.urgency_score >= 8 ? 'var(--critical)' : need.urgency_score >= 6 ? 'var(--high)' : need.urgency_score >= 4 ? 'var(--medium)' : 'var(--low)' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
            {need.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
              {need.city}
            </span>
            {distance !== undefined && (
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                · {distance.toFixed(1)} km
              </span>
            )}
            <UrgencyBadge score={need.urgency_score} />
          </div>
        </div>
        <span className="text-xs shrink-0" style={{ color: 'var(--ink-faint)' }}>
          {timeAgo(need.created_at)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="card cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <CategoryBadge category={need.category} />
        <UrgencyBadge score={need.urgency_score} />
      </div>

      <h3
        className="text-base font-semibold mb-1 line-clamp-2"
        style={{ fontFamily: 'var(--font-mukta)', color: 'var(--ink)' }}
      >
        {need.title}
      </h3>

      <p id="need-desc" className="text-sm mb-3 line-clamp-3" style={{ color: 'var(--ink-muted)' }}>
        {need.description}
      </p>

      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--ink-faint)' }}>
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {need.city}, {need.state}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {timeAgo(need.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {need.population_count} affected
        </span>
      </div>

      {need.sdg_tags && need.sdg_tags.length > 0 && (
        <div className="flex gap-1 mb-3">
          {need.sdg_tags.map((sdg) => (
            <span
              key={sdg}
              className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
              style={{ background: sdg === 'SDG2' ? '#DDA63A' : sdg === 'SDG3' ? '#4C9F38' : sdg === 'SDG4' ? '#C5192D' : sdg === 'SDG6' ? '#26BDE2' : sdg === 'SDG10' ? '#DD1367' : '#FD9D24' }}
            >
              {sdg}
            </span>
          ))}
        </div>
      )}

      {onAccept && (
        <button
          className="btn-primary w-full text-sm mt-2"
          onClick={(e) => { e.stopPropagation(); onAccept(); }}
        >
          Accept This Need
        </button>
      )}
    </div>
  );
}
