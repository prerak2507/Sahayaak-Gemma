'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PlatformStats } from '@/types';
// Dynamic import with SSR disabled for Three.js
const GlobeScene = dynamic(() => import('../three/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]">
      <div className="w-64 h-64 rounded-full border border-white/10 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--saffron)] animate-spin" />
      </div>
    </div>
  ),
});
// 🛡️ SUB-COMPONENT FOR CLIENT-SIDE STATS
function HeroStatsDisplay() {
  // Counted from the needs collection, same source as every other figure on the
  // site, so nothing here can disagree with the dashboards.
  const { data: stats } = useQuery({
    queryKey: ['platform_stats_hero'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(`stats returned ${res.status}`);
      return (await res.json()) as {
        total_needs: number;
        open_needs: number;
        needs_resolved: number;
        ai_triaged: number;
      };
    },
    staleTime: 60000,
    retry: 1,
  });

  // Zeroes on a fresh install rather than invented figures.
  const currentStats = stats ?? {
    total_needs: 0,
    open_needs: 0,
    needs_resolved: 0,
    ai_triaged: 0,
  };

  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-5 text-sm shadow-xl">
        <span className="live-dot" />
        <span className="text-white font-bold tracking-tight">
          <span className="text-[var(--saffron)] ml-1">{currentStats.open_needs}</span> reports open across Rajkot right now
        </span>
      </div>

      {/* Stats row at the bottom */}
      <div className="flex items-center gap-8 pt-4 pb-2 border-t border-white/20">
        <Link href="/join" className="flex flex-col hover:opacity-80 transition-opacity group">
          <span className="text-3xl font-black text-white font-mukta tabular-nums group-hover:text-[var(--saffron)] transition-colors">
            {currentStats.total_needs.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-200 font-black mt-1">Reports Filed</span>
        </Link>
        <div className="h-10 w-px bg-white/20" />
        <Link href="/ngos" className="flex flex-col hover:opacity-80 transition-opacity group">
          <span className="text-3xl font-black text-white font-mukta tabular-nums group-hover:text-[var(--saffron)] transition-colors">
            {currentStats.ai_triaged.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-200 font-black mt-1">Triaged by Gemma</span>
        </Link>
        <div className="h-10 w-px bg-white/20" />
        <div className="flex flex-col">
          <span className="text-3xl font-black text-white font-mukta tabular-nums">
            {(currentStats.needs_resolved).toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-200 font-black mt-1">Closed</span>
        </div>
      </div>
    </>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden flex flex-col lg:flex-row bg-[#0A0A0F]">
      {/* 3D Globe Background / Right Half */}
      <div className="absolute inset-0 lg:left-1/2 lg:w-1/2">
        <Suspense fallback={<div className="bg-[#0A0A0F] w-full h-full" />}>
          <GlobeScene />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#0A0A0F]/80 to-transparent hidden lg:block" />
      </div>

      {/* Left Content */}
      <div className="relative z-10 w-full lg:w-1/2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center h-full">
        <div className="max-w-2xl">
          
          {/* Use Stats sub-component only if mounted */}
          {mounted ? (
            <HeroStatsDisplay />
          ) : (
            <div className="h-[80px] flex items-end">
               <div className="w-full h-2 bg-white/10 animate-pulse rounded" />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mukta leading-[1.1] tracking-tight !text-white mb-4 mt-6">
            <span className="block text-[var(--saffron)] drop-shadow-[0_0_40px_rgba(255,107,53,0.4)]">Sahaayak</span>
            <span className="!text-white">Civic reporting for Rajkot, in your own language</span>
          </h1>

          <p className="text-base md:text-lg text-gray-100 font-medium leading-relaxed mb-8 max-w-xl drop-shadow-sm">
            Report a civic problem in Gujarati, Hindi or English, by text, voice or WhatsApp. Gemma 4 runs on the corporation's own hardware, reads it in whatever language you wrote it, works out which RMC department owns it, and sends a crew. No cloud, no translation desk, no org chart to learn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/report" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-mukta font-bold text-base bg-[var(--saffron)] text-white hover:bg-[var(--saffron-dark)] transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_30px_var(--saffron-glow)]"
            >
              Report an Issue
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
