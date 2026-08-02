'use client';

import { FileQuestion, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--saffron-light)', color: 'var(--saffron)' }}
      >
        {icon || <FileQuestion size={36} />}
      </div>
      <h3
        className="text-lg font-semibold mb-2 text-center"
        style={{ fontFamily: 'var(--font-mukta)', color: 'var(--ink)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm text-center max-w-sm mb-6"
        style={{ color: 'var(--ink-muted)' }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction}>
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
