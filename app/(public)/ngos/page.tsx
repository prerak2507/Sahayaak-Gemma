'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Building2, MapPin, ExternalLink, Globe, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfettiCelebration } from '@/components/shared/ConfettiCelebration';
import { DonationModal } from '@/components/shared/DonationModal';

const NGOS = [
  {
    name: 'Sanjeevani Relief NGO',
    category: 'Disaster Relief',
    location: 'Delhi, Gujarat',
    description: 'Rapid response team for flood and earthquake relief across Saurashtra.',
    impact: '15,000+ lives touched',
    verified: true,
    website: 'https://sanjeevanirelief.org',
  },
  {
    name: 'Disha Foundation',
    category: 'Education',
    location: 'Ahmedabad, Gujarat',
    description: 'Empowering underprivileged children through digital literacy and bridge schools.',
    impact: '5,000+ students graduated',
    verified: true,
    website: 'https://dishafoundation.edu.in',
  },
  {
    name: 'Green Earth Initiative',
    category: 'Environment',
    location: 'Surat, Gujarat',
    description: 'Urban afforestation and waste management consultants for smart cities.',
    impact: '100k+ trees planted',
    verified: true,
    website: 'https://greenearthinitiative.org',
  },
  {
    name: 'Helping Hands India',
    category: 'Healthcare',
    location: 'Vadodara, Gujarat',
    description: 'Mobile clinics providing healthcare to remote tribal areas in Gujarat.',
    impact: '25,000+ patients treated',
    verified: false,
    website: 'https://helpinghandsindia.in',
  },
  {
    name: 'Food For All',
    category: 'Hunger Relief',
    location: 'Delhi, Gujarat',
    description: 'Daily meal distribution to homeless and low-income families.',
    impact: '1M+ meals served',
    verified: true,
    website: 'https://foodforallindia.org',
  },
  {
    name: 'Asha Center',
    category: 'Women Empowerment',
    location: 'Ahmedabad, Gujarat',
    description: 'Skilling and micro-finance for rural women entrepreneurs.',
    impact: '2,000+ self-reliant women',
    verified: true,
    website: 'https://ashacenter.org',
  }
];

export default function NgosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [celebratingNGO, setCelebratingNGO] = useState<string | null>(null);
  const [donatingTo, setDonatingTo] = useState<string | null>(null);

  const filteredNgos = NGOS.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ngo.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || ngo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDonate = (ngoName: string) => {
    setDonatingTo(ngoName);
  };

  const handleDonationSuccess = () => {
    if (donatingTo) {
      setCelebratingNGO(donatingTo);
      setDonatingTo(null);
    }
  };

  const handleVisitWebsite = (url: string, ngoName: string) => {
    toast(`Redirecting to ${ngoName}'s official website...`, { icon: '🌐' });
    setTimeout(() => {
      window.open(url, '_blank');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] pt-24 pb-20">
      {celebratingNGO && (
        <ConfettiCelebration 
          message={`Thank you for your generous contribution to ${celebratingNGO}! Your support helps us build a more resilient community.`}
          onComplete={() => setCelebratingNGO(null)} 
        />
      )}

      {donatingTo && (
        <DonationModal 
          ngoName={donatingTo} 
          onClose={() => setDonatingTo(null)}
          onSuccess={handleDonationSuccess}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-mukta text-[var(--ink)] mb-4">
            Partner NGOs
          </h1>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl">
            Meet the organizations on the ground making a real difference. Verified, transparent, and impact-driven.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              <Search size={20} />
            </span>
            <input 
              type="text" 
              placeholder="Search by name, location or cause..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--border)] focus:ring-2 focus:ring-[var(--saffron-glow)] focus:border-[var(--saffron)] outline-none"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 rounded-xl border border-[var(--border)] bg-white font-medium text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--saffron-glow)]"
          >
            <option>All Categories</option>
            <option>Disaster Relief</option>
            <option>Education</option>
            <option>Healthcare</option>
            <option>Environment</option>
            <option>Hunger Relief</option>
            <option>Women Empowerment</option>
          </select>
        </div>

        {/* NGO Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo, i) => (
            <div key={i} className="card group hover:scale-[1.02] transition-all bg-white border border-[var(--border)] rounded-2xl p-6 flex flex-col h-full shadow-sm hover:shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--saffron)] group-hover:bg-[var(--saffron)] group-hover:text-white transition-colors">
                  <Building2 size={28} />
                </div>
                {ngo.verified && (
                  <span className="px-2 py-1 rounded-md bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-green-100">
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    Verified
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold font-mukta text-[var(--ink)] mb-1 group-hover:text-[var(--saffron)] transition-colors">
                {ngo.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-3">
                <MapPin size={14} className="text-gray-600" />
                {ngo.location}
              </div>

              <p className="text-sm text-gray-500 mb-6 flex-1 italic">
                "{ngo.description}"
              </p>

              <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">Impact</span>
                  <span className="text-sm font-bold text-[var(--ink)]">{ngo.impact}</span>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleVisitWebsite(ngo.website, ngo.name)}
                    title="Visit Website"
                    className="p-2 rounded-lg bg-[var(--surface-2)] text-[var(--ink-muted)] hover:bg-[var(--saffron-light)] hover:text-[var(--saffron)] transition-colors"
                   >
                     <Globe size={18} />
                   </button>
                   <button 
                    onClick={() => handleDonate(ngo.name)}
                    className="px-4 py-2 rounded-lg bg-[var(--saffron)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[var(--saffron-glow)]"
                   >
                     Donate <Heart size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-20 p-8 md:p-12 rounded-3xl bg-[var(--sidebar-bg)] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--saffron)] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold font-mukta mb-4 text-white">Are you an NGO working for change?</h2>
            <p className="text-gray-300 mb-8 px-4">
              Join the Sahaayak network to find verified volunteers, access disaster mode alerts, and digitize your impact reports.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/join?role=ngo" className="btn-primary px-8 py-3 text-base">
                Register Organization
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
