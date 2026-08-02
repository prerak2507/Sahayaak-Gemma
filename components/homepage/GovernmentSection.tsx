'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MessageSquare, Users, ArrowRight } from 'lucide-react';

export function GovernmentSection() {
  const cards = [
    {
      title: 'Instant WhatsApp Civic Intake',
      description: 'Citizens report infrastructure issues via WhatsApp or web. AI geofences, translates, and professionally verifies reports instantly.',
      icon: <MessageSquare size={24} className="text-[#E85D04]" />,
      link: '/report',
      badge: 'Grassroots Voice',
      colorClass: 'hover:border-[#E85D04]/30',
      iconBg: 'bg-orange-50 border-orange-100',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    {
      title: 'Executive Municipal Commissioner Suite',
      description: 'Municipal authorities hold final-override validation audits, real-time GIS command maps, and automated department dispatch, managing field crew skills and workload in minutes.',
      icon: <Building2 size={24} className="text-[#0284C7]" />,
      link: '/government',
      badge: 'Sovereign Control',
      colorClass: 'hover:border-[#0284C7]/30',
      iconBg: 'bg-sky-50 border-sky-100',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    {
      title: 'NGO & Community-Led Action',
      description: 'Registered NGOs coordinate relief, import datasets with AI spatial audit validation, and deploy field volunteers to hot zones without duplicate effort or resource wastage.',
      icon: <Users size={24} className="text-[#0F766E]" />,
      link: '/ngos',
      badge: 'Field Agility',
      colorClass: 'hover:border-[#0F766E]/30',
      iconBg: 'bg-teal-50 border-teal-100',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-100'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 border-t border-[var(--border)] relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.25em] bg-teal-50 px-3 py-1 rounded-full border border-teal-100/80">
            Sahaayak Unified Ecosystem
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-mukta text-[var(--ink)] mt-4">
            A Unified Ecosystem for State Authority and Civic Action.
          </h2>
          <p className="text-base text-[var(--ink-muted)] mt-4 leading-relaxed font-medium">
            Sahaayak acts as a secure municipal command network, coordinating grassroots intake with state administrative control and rapid dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              className={`group bg-white/80 backdrop-blur-xl border border-[var(--border)] ${card.colorClass} rounded-[2rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 right-0 p-4 relative z-10">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
              <div className="space-y-6 relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {card.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold font-mukta text-[var(--ink)] group-hover:text-[#0F766E] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed font-semibold">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-50 relative z-10">
                <Link 
                  href={card.link}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#0F766E] uppercase tracking-wider hover:gap-2.5 transition-all"
                >
                  Explore Module <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] text-white rounded-xl font-mukta font-extrabold text-sm tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Report an Issue
          </Link>
          <Link 
            href="/government"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0F766E] hover:bg-[#0d645e] text-white rounded-xl font-mukta font-extrabold text-sm tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Access Municipal Commissioner Suite <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
