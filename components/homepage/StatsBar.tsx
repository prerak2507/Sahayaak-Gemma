'use client';

import { useRef, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useInView } from 'framer-motion';
import { formatNumber } from '@/lib/utils';
import { PlatformStats } from '@/types';

function Counter({ from, to, inView }: { from: number; to: number; inView: boolean }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!inView) {
      setCount(from);
      return;
    }

    let start = from;
    const duration = 1400; // 1.4s
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = Math.floor(start + (to - start) * easeProgress);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(updateCount);
  }, [from, to, inView]);

  return <>{formatNumber(count)}</>;
}

export function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Counted from the needs collection rather than read from a stored counter,
  // so filing a report moves these immediately. See app/api/stats/route.ts.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error(`stats returned ${res.status}`);
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (error) {
        console.error('Could not derive platform stats:', error);
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statItems = [
    { label: 'Reports filed', value: stats?.total_needs ?? 0 },
    { label: 'Open right now', value: stats?.open_needs ?? 0 },
    { label: 'Closed', value: stats?.needs_resolved ?? 0 },
    { label: 'Triaged by Gemma', value: stats?.ai_triaged ?? 0 },
    { label: 'Wards covered', value: stats?.wards_covered ?? 0 },
  ];

  return (
    <div className="w-full bg-[var(--surface-2)] border-y border-[var(--border)] py-8" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center divide-x divide-[var(--border)]">
          {statItems.map((stat, i) => (
            <div key={i} className="px-6 md:px-12 py-4 flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-bold font-mukta text-[var(--saffron)] tabular-nums mb-1">
                {stats ? <Counter from={0} to={stat.value} inView={isInView} /> : '0'}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)] text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
