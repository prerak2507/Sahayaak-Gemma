'use client';

import { MessageSquare, Cpu, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const steps = [
    {
      icon: <MessageSquare size={32} />,
      title: "1. Collect",
      desc: "Citizens send photos and locations via the platform they already use: WhatsApp."
    },
    {
      icon: <Cpu size={32} />,
      title: "2. Prioritize & Route",
      desc: "Gemma 4 reads the report in Gujarati, Hindi or English, scores how dangerous it is, and routes it to the right department."
    },
    {
      icon: <Users size={32} />,
      title: "3. Resolve",
      desc: "Professional field crews are matched and dispatched instantly."
    }
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold font-mukta text-center mb-16 text-[var(--ink)]">
          How Sahaayak works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center relative z-10 group"
            >
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-md border border-[var(--border)] group-hover:border-[var(--saffron)] transition-colors duration-300 relative overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--saffron-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-[var(--saffron)] bg-[var(--saffron-light)] relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold font-mukta mb-3 text-[var(--ink)]">{step.title}</h3>
              <p className="text-[var(--ink-muted)] text-base max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
