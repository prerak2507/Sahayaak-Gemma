'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const NeedsMap = dynamic(() => import('@/components/map/NeedsMap'), { ssr: false, loading: () => (
  <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--surface-2)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--saffron)] animate-spin" />
      <p className="text-[var(--ink-muted)] font-medium">Loading map constraints...</p>
    </div>
  </div>
)});

export default function MapPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row bg-[var(--surface)]">
      <Suspense fallback={null}>
        <NeedsMap />
      </Suspense>
    </div>
  );
}
