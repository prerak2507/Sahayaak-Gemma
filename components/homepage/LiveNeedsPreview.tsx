'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Need, CITIES } from '@/types';
import { NeedCard } from '../shared/NeedCard';
import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { scopeToCity } from '@/lib/data/needs';

export function LiveNeedsPreview() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].name);

  // Fetch needs for the selected city
  const [needs, setNeeds] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Served from the API rather than a browser Firestore subscription: this is a
  // public page, and anonymous readers are denied by the security rules, which
  // left this section empty for every visitor who was not logged in.
  //
  // An empty board now renders as an empty board. The three example needs that
  // used to appear here are gone, because a visitor cannot tell an example from
  // a real report.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/needs?assignment=all&limit=50');
        if (!res.ok) throw new Error(`needs returned ${res.status}`);
        const { needs: rows } = await res.json();

        const open = ((rows ?? []) as Need[])
          .filter((n) => n.status !== 'closed' && n.status !== 'completed')
          .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))
          .slice(0, 5);

        if (!cancelled) setNeeds(open);
      } catch (error) {
        console.error('Could not load live needs:', error);
        if (!cancelled) setNeeds([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    // Refresh so a report filed during a demo appears without a reload.
    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedCity]);

  return (
    <section className="py-24 bg-[#0A0A0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 
              className="text-4xl md:text-5xl font-black font-mukta mb-4 flex items-center gap-4 !text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              style={{ color: 'white' }}
            >
              <span className="live-dot scale-150 shadow-[0_0_15px_rgba(22,163,74,0.5)]" />
              Active needs right now
            </h2>
            <p className="text-gray-300 font-medium">Real-time requests awaiting volunteer support.</p>
          </div>
          
          <Link href="/map" className="text-[var(--saffron)] flex items-center gap-2 hover:underline font-medium">
            View full needs map <ArrowRight size={16} />
          </Link>
        </div>

        {/* City Filter Pills */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
          {CITIES.map(city => (
            <button
              key={city.name}
              onClick={() => setSelectedCity(city.name)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCity === city.name 
                  ? 'bg-[var(--saffron)] text-white border-[var(--saffron)]' 
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Needs Horizontal Scroll */}
        <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoading ? (
            // Skeleton loader for dark background
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[300px] w-[300px] snap-center shrink-0 h-48 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
            ))
          ) : needs && needs.length > 0 ? (
            needs.map(need => (
              <div key={need.id} className="min-w-[300px] w-[300px] snap-center shrink-0">
                <div className="glass-card h-full p-0 overflow-hidden flex flex-col group hover:border-white/30 transition-colors">
                  {/* Category color strip */}
                  <div 
                    className="h-1.5 w-full" 
                    style={{ background: need.urgency_score >= 8 ? 'var(--critical)' : need.urgency_score >= 6 ? 'var(--high)' : 'var(--saffron)' }} 
                  />
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-mukta font-semibold text-lg line-clamp-2 mb-3 mt-1 text-white group-hover:text-[var(--saffron)] transition-colors">
                      {need.title}
                    </h3>
                    
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                        <MapPin size={14} className="text-[var(--saffron)]" />
                        {need.ward || need.city}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                           need.urgency_score >= 8 ? 'bg-red-500/20 text-red-400' : 
                           need.urgency_score >= 6 ? 'bg-orange-500/20 text-orange-400' : 
                           'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {need.urgency_score >= 8 ? 'Critical' : need.urgency_score >= 6 ? 'High' : 'Medium'} · {need.urgency_score.toFixed(1)}
                        </span>
                        
                        <span className="text-xs text-gray-400">
                          {new Date(need.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-12 text-center text-gray-300 border border-white/10 rounded-2xl bg-white/5 font-medium">
              No active needs in {selectedCity} right now. Select another city.
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </section>
  );
}
