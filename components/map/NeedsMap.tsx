'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Need, CATEGORY_COLORS, SUPPORTED_LANGUAGES } from '@/types';
import { Search, Filter, Layers, Navigation, Sparkles, CheckCircle2, Heart, Shield, MessageSquare, X, MapPin, Mic, Camera, ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { timeAgo, getUrgencyClass } from '@/lib/utils';
import { NeedCard } from '../shared/NeedCard';
import toast from 'react-hot-toast';
import { useReportStore } from '@/stores/reportStore';
import { scopeToCity } from '@/lib/data/needs';

function FlyToPoint({ lat, lng, zoom }: { lat: number, lng: number, zoom: number }) {
  const map = useMap();
  map.flyTo([lat, lng], zoom, { duration: 1.5 });
  return null;
}

const createCustomPin = (score: number, category: string, assignmentType?: string) => {
  const color = score >= 8 ? '#DC2626' : score >= 6 ? '#EA580C' : score >= 4 ? '#D97706' : '#16A34A';
  const pulseClass = score >= 8 ? 'critical-pulse' : '';
  
  // Custom pin design showing Shield for Government and Heart for NGO
  const iconHtml = assignmentType === 'government' 
    ? `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3))"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`
    : `<svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3))"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;

  const html = `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${pulseClass}" style="background: ${color}; border: 2.5px solid ${assignmentType === 'government' ? '#3B82F6' : '#EA580C'}; transition: transform 0.2s;">
    ${iconHtml}
  </div>`;
  
  return new L.DivIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function NeedsMap() {
  const searchParams = useSearchParams();
  const { isAuthenticated, loginAsDemo, user } = useAuthStore();
  const { currentLanguage, getSarvamLanguage } = useUIStore();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setSelectedCity(cityParam);
    }
  }, [searchParams]);

  const { upvoteReport, downvoteReport } = useReportStore();
  const [needs, setNeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read through the server rather than subscribing to Firestore from the
  // browser. This page is public, and an anonymous visitor hitting Firestore
  // directly gets permission-denied from the security rules, which rendered the
  // map empty for exactly the people it exists for. The server holds the
  // credential and decides what is public. See app/api/needs/route.ts.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/needs?assignment=government&limit=300');
        if (!res.ok) throw new Error(`needs returned ${res.status}`);
        const { needs: rows } = await res.json();
        if (!cancelled) setNeeds(rows ?? []);
      } catch (error) {
        console.error('Could not load the reports board:', error);
        if (!cancelled) setNeeds([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    // Refresh periodically so a report filed during a demo appears without a
    // reload. Cheap: one scoped read.
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filteredNeeds = useMemo(() => {
    if (!needs) return [];
    return needs.filter(n => {
      const hasCoords = typeof n.location_lat === 'number' && typeof n.location_lng === 'number';
      if (!hasCoords) return false;
      
      // Municipal work only, matching what the officer dashboards show.
      // assignment_type is the routing discriminator; category is the service
      // taxonomy and never carries the value 'government'.
      if (n.assignment_type !== 'government') return false;

      if (!searchQuery) return true;
      
      return n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             n.ward?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             n.city.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [needs, searchQuery]);

  const handleResolve = () => {
    setIsResolving(true);
    toast.success('Analyzing your location and profile for deployment...', { icon: '⚡' });
  };

  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery, 
          categories: ['food', 'medical', 'water_sanitation', 'disaster_relief'] 
        })
      });
      
      const filter = await res.json();
      if (filter.category) {
        toast.success(`AI Filter: Showing ${filter.category} in ${filter.city || 'all cities'}`, { icon: '🤖' });
        // You would apply these filters to your local state here
      }
    } catch (error) {
      console.error('AI Search failed', error);
    } finally {
      setIsAiSearching(false);
    }
  };

  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [radarInsights, setRadarInsights] = useState<any | null>(null);

  const handleRadar = async () => {
    if (filteredNeeds.length === 0) {
      toast.error('No needs detected on map to scan.');
      return;
    }
    setIsRadarLoading(true);
    const toastId = toast.loading('AI Radar scanning regional needs...', { icon: '📡' });
    
    try {
      const res = await fetch('/api/ai/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs: filteredNeeds })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setRadarInsights(data);
      toast.success('AI Radar scan complete. Strategic insights generated.', { id: toastId });
    } catch (error) {
      console.error('Radar failed', error);
      toast.error('AI Radar scan failed.', { id: toastId });
    } finally {
      setIsRadarLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full relative overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-full md:w-[340px] shrink-0 h-1/2 md:h-full bg-white border-r border-[var(--border)] flex flex-col z-[10] shadow-lg relative">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" size={18} />
            <input 
              type="text" 
              placeholder="Search location, ward..." 
              className="w-full pl-10 pr-12 py-2 bg-[var(--surface-2)] rounded-lg text-sm border-none focus:ring-2 focus:ring-[var(--saffron)] transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            />
            <button 
              onClick={handleAiSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${isAiSearching ? 'bg-[var(--saffron)] text-white animate-pulse' : 'text-[var(--saffron)] hover:bg-[var(--saffron-light)]'}`}
            >
              <Sparkles size={16} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 py-1.5 px-3 bg-[var(--surface-2)] rounded-md text-xs font-medium flex items-center justify-center gap-1 hover:bg-[var(--surface-3)]">
              <Filter size={14} /> Filter
            </button>
            <button 
              onClick={handleRadar}
              disabled={isRadarLoading}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${isRadarLoading ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            >
              <Sparkles size={14} /> {isRadarLoading ? 'Scanning...' : 'AI Radar'}
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center text-[10px] text-[var(--ink-muted)] font-bold uppercase tracking-widest">
          <span>{filteredNeeds.length} Urgent Needs Detected</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {filteredNeeds.map(need => (
            <div 
              key={need.id} 
              onClick={() => setSelectedNeed(need)}
              className={`cursor-pointer transition-all ${selectedNeed?.id === need.id ? 'ring-2 ring-[var(--saffron)] scale-[1.02]' : ''}`}
            >
              <NeedCard need={need} compact />
            </div>
          ))}
          {filteredNeeds.length === 0 && (
            <div className="text-center py-12 text-[var(--ink-muted)] text-sm">
              <MapPin className="mx-auto mb-2 opacity-20" size={48} />
              No needs match your search.
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-1/2 md:h-full z-0">
        <MapContainer 
          center={[28.6139, 77.2090]} 
          zoom={12} 
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {selectedNeed && (
            <FlyToPoint lat={selectedNeed.location_lat} lng={selectedNeed.location_lng} zoom={15} />
          )}

          {filteredNeeds.map(need => (
            <LayerGroup key={need.id}>
              <Marker 
                position={[need.location_lat, need.location_lng]}
                icon={createCustomPin(need.urgency_score, need.category, need.assignment_type)}
                eventHandlers={{
                  click: () => setSelectedNeed(need),
                }}
              >
              <Popup>
                <div className="min-w-[220px] p-1.5 flex flex-col">
                  <p className="font-bold text-[var(--ink)] mb-1 leading-snug">{need.title}</p>
                  <p className="text-[10px] text-[var(--ink-muted)] mb-3 flex items-center gap-1"><Navigation size={10} />{need.ward || need.city}</p>
                  
                  {need.assigned_worker_name ? (
                    <div className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-2 mb-3 w-full max-w-[200px] flex items-center gap-2">
                      {need.assigned_worker_avatar ? (
                         <img src={need.assigned_worker_avatar} alt={need.assigned_worker_name} className="w-6 h-6 rounded-full border border-indigo-200 shrink-0" />
                      ) : (
                         <Shield size={16} className="text-indigo-500 shrink-0" />
                      )}
                      <div className="flex flex-col overflow-hidden">
                         <span className="uppercase tracking-wider truncate">Assigned: {need.assigned_worker_name}</span>
                         <span className="text-[8px] opacity-80 leading-tight truncate">{need.assigned_worker_title || need.assigned_department}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-3 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-1.5 w-fit">
                       <ArrowBigUp size={11} className="text-amber-500 shrink-0" /> In Progress ({need.upvotes || 0}/25)
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setSelectedNeed(need)} 
                    className="w-full py-2 bg-[var(--saffron)] text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-orange-600 hover:shadow-lg transition-all"
                  >
                    Review Critical Need
                  </button>
                </div>
              </Popup>
              </Marker>
            </LayerGroup>
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
           <div className="bg-white rounded-2xl shadow-xl border border-[var(--border)] p-1.5 flex flex-col gap-1">
              <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 text-[var(--ink)]"><Layers size={20} /></button>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 text-[var(--ink)]"><Navigation size={20} /></button>
           </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNeed && (
        <div className="absolute top-0 right-0 w-full md:w-[420px] h-full bg-white shadow-2xl z-[500] border-l border-[var(--border)] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
            <div>
              <h3 className="font-bold font-mukta text-lg">Crisis Inspection</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Need ID: #{selectedNeed.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedNeed(null)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-3xl font-light">&times;</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Visual Gallery */}
            {selectedNeed.photo_urls && selectedNeed.photo_urls.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} /> Incident Documentation
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedNeed.photo_urls.map((url: string, i: number) => (
                    <div key={i} className={`rounded-[24px] overflow-hidden border border-slate-100 shadow-sm ${i === 0 && selectedNeed.photo_urls.length === 1 ? 'col-span-2' : ''}`}>
                      <img src={url} alt="Incident" className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <NeedCard need={selectedNeed} />
            
            <div className="bg-orange-50 border-2 border-orange-100 rounded-[24px] p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 opacity-20 -rotate-12 translate-x-10 -translate-y-10 rounded-full" />
               <h4 className="flex justify-between text-xs font-bold text-orange-700 mb-4 relative z-10">
                  <span className="flex items-center gap-1.5 uppercase tracking-widest"><Sparkles size={14} /> Community Verification</span>
                  <span>Votes: {selectedNeed.upvotes || 0}/25</span>
               </h4>
               <p className="text-sm text-orange-800 leading-relaxed relative z-10">
                 Reports require <strong>25 upvotes</strong> from verified citizens before being automatically assigned to City contractors.
                 Help verify if this issue is legitimate.
               </p>
               <div className="mt-4 pt-4 border-t border-orange-100 flex gap-4 relative z-10">
                  <button 
                    onClick={() => {
                      if (!isAuthenticated || user?.role !== 'citizen') {
                        window.location.href = '/login';
                        return;
                      }
                      if ((user?.false_reports_count ?? 0) >= 5) {
                        toast.error('KYC Verification Failed: Account suspended due to false reports.');
                        return;
                      }
                      upvoteReport(selectedNeed.id);
                      toast.success('Upvote cast! You earned +5 Trust XP.');
                    }}
                    className={`flex-1 py-3 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors bg-amber-500 hover:bg-amber-600`}
                  >
                    <ArrowBigUp size={16} /> Upvote Issue
                  </button>
                  <button 
                    onClick={() => {
                      if (!isAuthenticated || user?.role !== 'citizen') {
                        window.location.href = '/login';
                        return;
                      }
                      if ((user?.false_reports_count ?? 0) >= 5) {
                        toast.error('KYC Verification Failed: Account suspended due to false reports.');
                        return;
                      }
                      downvoteReport(selectedNeed.id);
                      toast('Downvoted as false/spam.');
                    }}
                    className="w-12 flex items-center justify-center bg-white border-2 border-orange-200 rounded-xl text-orange-400 hover:bg-orange-100 transition-colors"
                  >
                    <ArrowBigDown size={16} />
                  </button>
               </div>
            </div>

          </div>


        </div>
      )}

      {/* RESOLUTION FLOW MODAL */}
      {isResolving && selectedNeed && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[var(--ink)]/60 backdrop-blur-md" onClick={() => setIsResolving(false)} />
           <div className="relative bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in slide-in-from-bottom-12 duration-500">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center mb-8"><CheckCircle2 size={56} strokeWidth={1.5} /></div>
              <h2 className="text-3xl font-bold font-mukta text-[var(--ink)] mb-4">Step Into Service</h2>
              <p className="text-[var(--ink-muted)] mb-10 leading-relaxed">
                 You are initializing a **Voluntary Intervention** for: <br/>
                 <span className="text-[var(--ink)] font-bold">"{selectedNeed.title}"</span>
              </p>
              
              <div className="w-full space-y-4 mb-10">
                 <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left hover:border-green-200 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600"><Heart size={20} /></div>
                    <div><p className="text-xs font-bold">Karma Accrual</p><p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">+500 Points Potential</p></div>
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><MessageSquare size={20} /></div>
                    <div><p className="text-xs font-bold">Deployment Hub</p><p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Connect with HQ via Sahaayak Chat</p></div>
                 </div>
              </div>

              <div className="flex gap-3 w-full">
                 <button onClick={() => setIsResolving(false)} className="flex-1 py-4 text-xs font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                 <button 
                    onClick={() => {
                       // Auto-login as demo volunteer if not authenticated
                       if (!isAuthenticated) {
                          loginAsDemo('volunteer');
                       }
                       setIsResolving(false);
                       setSelectedNeed(null);
                       toast.success('Assigned to mission hub. Proceed to Dashboard!', { duration: 4000 });
                       
                       // Small delay to ensure store update before redirect
                       setTimeout(() => {
                         window.location.href = '/volunteer/dashboard';
                       }, 100);
                    }}
                    className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                 >
                    Confirm Deployment
                 </button>
              </div>
              
              <button 
                onClick={() => setIsResolving(false)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-2xl text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>
      )}

      {/* AI RADAR INSIGHTS OVERLAY */}
      {radarInsights && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-[1000] animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-slate-900 text-white rounded-[32px] shadow-2xl border border-white/10 p-8 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600 opacity-20 blur-3xl rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600 opacity-20 blur-3xl rounded-full" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div>
                    <h3 className="text-xl font-bold font-mukta flex items-center gap-2">
                       <Sparkles className="text-indigo-400" size={20} /> AI Strategic Radar
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time predictive intelligence</p>
                 </div>
                 <button onClick={() => setRadarInsights(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                 <div className="space-y-4">
                    <div>
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[2px] mb-2">Primary Hotspot</h4>
                       <p className="text-sm font-bold">{radarInsights.hotspot}</p>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[2px] mb-2">Emerging Patterns</h4>
                       <ul className="space-y-1.5">
                          {radarInsights.patterns?.map((p: string, i: number) => (
                             <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" /> {p}
                             </li>
                          ))}
                       </ul>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-green-400 uppercase tracking-[2px] mb-2">Positive Signal</h4>
                       <p className="text-xs text-slate-300 italic">"{radarInsights.positiveSignal}"</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[2px] mb-2">Cascading Risks</h4>
                       <ul className="space-y-1.5">
                          {radarInsights.risks?.map((r: string, i: number) => (
                             <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" /> {r}
                             </li>
                          ))}
                       </ul>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[2px] mb-3 flex items-center gap-1.5">
                          <Shield size={12} className="text-indigo-400" /> Strategic Action
                       </h4>
                       <ul className="space-y-2">
                          {radarInsights.recommendations?.map((r: string, i: number) => (
                             <li key={i} className="text-[11px] font-medium leading-relaxed text-slate-200">
                                <span className="text-indigo-400 font-bold">#{i+1}</span> {r}
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 relative z-10">
                 <button 
                    onClick={() => {
                       toast.success('Strategy dispatched to district command center');
                       setRadarInsights(null);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20"
                 >
                    Dispatch Recommendations
                 </button>
                 <button 
                    onClick={() => setRadarInsights(null)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                 >
                    Dismiss
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
