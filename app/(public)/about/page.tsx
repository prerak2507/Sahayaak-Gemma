'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Globe, Zap, Users, Sparkles, 
  XCircle, CheckCircle2, ShieldAlert, Cpu, 
  ArrowRight, Layers, Droplets, Wind, AlertTriangle
} from 'lucide-react';

const coreValues = [
  {
    icon: ShieldCheck,
    title: "Verification First",
    desc: "Every civic report and NGO CSV upload is validated through AI spatial-audit checks to guarantee legitimacy and optimize resource allocation.",
    color: "text-emerald-600",
    bg: "bg-emerald-50/50 border border-emerald-100"
  },
  {
    icon: Globe,
    title: "Language Inclusivity",
    desc: "Native voice reporting in regional languages translates and processes citizen needs instantly, eliminating administrative barriers.",
    color: "text-blue-600",
    bg: "bg-blue-50/50 border border-blue-100"
  },
  {
    icon: Zap,
    title: "Autonomous Dispatch",
    desc: "Advanced routing maps issues to specialized municipal departments and matches field crew skills dynamically within seconds.",
    color: "text-[var(--saffron)]",
    bg: "bg-orange-50/50 border border-orange-100"
  }
];

const simulatorScenarios = [
  {
    title: "Minto Bridge Monsoon Waterlogging",
    department: "Public Works Department (PWD)",
    icon: Droplets,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    legacy: {
      totalTime: "2.5 Weeks",
      steps: [
        { title: "Manual Complaint File", desc: "Citizen files a complaint on a static web form. The report is placed in an unsorted database queue." },
        { title: "Administrative Sorting", desc: "A PWD clerk reviews the queue after 4 days. Re-categorizes the location coordinates manually." },
        { title: "NGO Siloed Search", desc: "A local NGO attempts to clear nearby drains but has zero info on public blockages, duplicating efforts." },
        { title: "Sub-Optimal Dispatch", desc: "A standard crew is sent without specialized high-capacity pumping machinery, delaying drainage by another week." },
        { title: "Belated Resolution", desc: "Drainage is eventually cleared after severe local flooding, transit gridlocks, and community economic damage." }
      ]
    },
    sahaayak: {
      totalTime: "1.2 Hours",
      steps: [
        { title: "GIS Remote Sensing", desc: "Satellite anomaly sweep automatically logs liquid pooling signature at Minto Bridge coordinates instantly." },
        { title: "AI Dispatch & Routing", desc: "The engine matches the waterlogging severity, maps it to PWD, and flags it on the Commissioner command deck." },
        { title: "Skill-Matched Dispatch", desc: "City crew lead (Ramesh Kumar - Drainage specialist) is dispatched instantly with designated high-capacity pumps." },
        { title: "NGO-Civil Sync", desc: "Vetted NGO volunteers are automatically routed on the map dashboard to coordinate traffic detours and assist citizens." },
        { title: "Telemetry Audit Closure", desc: "Spatial coordinates log dry conditions, and a telemetry verification audit instantly closes the ticket." }
      ]
    }
  },
  {
    title: "Anand Vihar Severe AQI Spike",
    department: "Delhi Pollution Control Committee",
    icon: Wind,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    legacy: {
      totalTime: "1.5 Weeks",
      steps: [
        { title: "Sensor Capture Ignored", desc: "Air telemetry logs AQI of 480, but data is only consolidated into daily reports on a manual schedule." },
        { title: "Emergency Deliberation", desc: "After 3 days of heavy pollution, the authority sits for physical meetings to declare emergency spray protocols." },
        { title: "Blind NGO Relief", desc: "NGOs distribute N95 masks on their own using WhatsApp lists, entirely missing the highly toxic street clusters." },
        { title: "Siloed Water Spraying", desc: "Tankers spray water randomly based on public requests rather than targeting toxic hotspots, yielding minimal impact." },
        { title: "Delayed Air Relief", desc: "Wind patterns eventually disperse the smog layer after causing major public health hospital admissions." }
      ]
    },
    sahaayak: {
      totalTime: "3.0 Hours",
      steps: [
        { title: "Predictive AQI Trigger", desc: "IoT grid telemetry registers AQI spike > 450. Sahaayak immediately initiates environmental emergency mode." },
        { title: "Autonomous Dispatch", desc: "AI maps the closest active water tankers and routes them instantly along the Anand Vihar transit terminals." },
        { title: "Smart NGO Command Sync", desc: "Local NGO squads receive geodated hot zones in their app to distribute masks directly in high-density toxic points." },
        { title: "Continuous Telemetry", desc: "Water spray tankers feed coordinate progress to the GIS deck, validating particulate matter suppression." },
        { title: "Commissioner Overview", desc: "The command dashboard visualizes active particulate reduction graphs in real-time, closing the crisis cycle." }
      ]
    }
  },
  {
    title: "Yamuna River Frothing Crisis",
    department: "Delhi Jal Board (Water Supply)",
    icon: AlertTriangle,
    badgeColor: "bg-red-50 text-red-700 border-red-100",
    legacy: {
      totalTime: "3.0 Weeks",
      steps: [
        { title: "Social Media Cry", desc: "Citizen uploads a photo of thick white chemical foam at Kalindi Kunj. No official report is formally created." },
        { title: "Jurisdictional Dispute", desc: "Departments argue over authority (Irrigation vs. Jal Board vs. Environment). File is passed for 8 days." },
        { title: "Manual Lab Sampling", desc: "Inspectors are sent to fetch physically bottled water samples. Chemical lab results take 6 additional days." },
        { title: "NGO Hazardous Cleanup", desc: "Civic volunteers try to clean the water manually without protective equipment, causing severe health risks." },
        { title: "Chemical Neutralizer", desc: "After public outcry, neutralizers are ordered and applied. The environmental ecosystem has already collapsed." }
      ]
    },
    sahaayak: {
      totalTime: "5.0 Hours",
      steps: [
        { title: "Satellite Signature Match", desc: "Multi-spectral remote sensing scans chemical foam indices, flagging severe phosphate levels at Kalindi Kunj." },
        { title: "Sovereign Audit Override", desc: "System bypasses bureaucratic hoops, issuing an overriding environmental dispatch under Delhi Jal Board." },
        { title: "Bio-Waste Crew Dispatch", desc: "AI dispatches certified Bio-Waste Specialists equipped with protective gear and chemical neutralizers." },
        { title: "NGO Coordination HUD", desc: "Sahaayak maps a strict danger perimeter. Synced NGOs distribute safety notices to fishers and communities." },
        { title: "Spatial Proof Audit", desc: "Telemetry verifies successful spraying and foam dissipation, uploading coordinates and chemical index data." }
      ]
    }
  }
];

export default function AboutPage() {
  const [selectedScenario, setSelectedScenario] = useState(0);

  return (
    <div className="bg-gradient-to-tr from-orange-50/10 via-white to-emerald-50/10 min-h-screen text-slate-800 transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-slate-100">
        {/* Sleek Gradient Ambient Backdrops */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[var(--saffron)] opacity-5 blur-[130px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-emerald-600 opacity-5 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-2 shadow-sm">
              <Sparkles size={13} className="animate-pulse text-emerald-600" /> The Sovereign Paradigm of Civic Action
            </span>
            <h1 className="text-4xl md:text-7xl font-bold font-mukta leading-[1.1] tracking-tight text-slate-900">
              Why Sahaayak? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--saffron)] via-orange-500 to-emerald-600 animate-gradient">
                Bridging Municipal Command & Grassroots Impact.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-550 max-w-3xl mx-auto font-medium leading-relaxed mt-4">
              Traditional public systems are built for filing paperwork. Sahaayak is engineered to coordinate action, uniting municipal government power and NGO agility on a single geodetic command deck.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Sahaayak In-Depth Section */}
      <section className="py-24 bg-white border-b border-slate-100 transition-colors duration-300 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Coordinating the Frontlines
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-mukta text-slate-900 leading-tight">
              Solving the Coordination Crisis
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              In urban disasters and daily municipal strain alike, the barrier to efficient resolution isn't a shortage of willingness or assets—it is the fatal fragmentation of geodetic data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* The Left Side: In-depth problems and why we built this */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 text-left"
            >
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold font-mukta text-slate-900">
                  Why Grassroots Efforts Stall
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  When a civic problem hits Rajkot, monsoon water standing in the low-lying wards, a sewer main backing up on Gondal Road, a stretch of street lights out on University Road, the response splits into two disconnected halves:
                </p>
              </div>

              {/* In-depth Bottlenecks */}
              <div className="space-y-4 pt-2">
                
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-650 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      1. Bureaucratic Pipeline Paralysis
                    </h4>
                    <p className="text-[12px] text-slate-550 leading-relaxed font-medium">
                      Traditional municipal channels act as passive grievance collectors. A complaint is sorted manually through various clerical levels. Because there is no live remote sensing or unified routing, simple blockages escalate into major infrastructure delays while waiting in paper queues.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-650 shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      2. The NGO & Field Engineer Coordination Gap
                    </h4>
                    <p className="text-[12px] text-slate-550 leading-relaxed font-medium">
                      Grassroots groups distribute relief using disparate WhatsApp chats and outdated spreadsheets. This geographic blindness causes volunteer duplications in central, high-profile neighborhoods, leaving marginalized slums and outer wards completely neglected.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Layers size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      3. The Sovereign Multi-Tenant Solution
                    </h4>
                    <p className="text-[12px] text-slate-550 leading-relaxed font-medium">
                      Sahaayak resolves this fragmentation by establishing a secure command hierarchy. Municipal authorities hold supreme oversight, validation audits, and automated department dispatch commands, while registered NGOs operate synchronously to claim tasks, geocode coordinates, and upload reports.
                    </p>
                  </div>
                </div>

              </div>

              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-200 p-6 rounded-3xl space-y-3">
                <span className="text-[10px] font-mono text-emerald-700 font-black uppercase tracking-wider block">🦾 THE SAHAAYAK CONVERGENCE</span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  By merging government administrative resources with grassroots agility, Sahaayak operates with a <strong>1.2-hour average response velocity</strong>, resolving crises in hours that previously took weeks.
                </p>
              </div>
            </motion.div>

            {/* The Right Side: AI Pillars of Sahaayak */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 text-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150 pointer-events-none text-slate-900">
                <Cpu size={150} />
              </div>

              <div className="relative z-10 text-left space-y-8">
                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">PROACTIVE TELEMETRY</span>
                  <h3 className="text-2xl md:text-3xl font-extrabold font-mukta text-slate-900">The Sahaayak Core Pillars</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--saffron)] to-orange-550 flex items-center justify-center font-black text-sm shrink-0 shadow-sm text-white">1</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Geospatial Satellite Sweep</h4>
                      <p className="text-slate-550 text-[11.5px] leading-relaxed">AI automatically analyzes multi-spectral remote sensing imagery (Google Earth Engine) to flag waterlogging, illegal waste dumping, and toxic emissions before citizens file a single report.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-sm shrink-0 shadow-sm text-white">2</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Skills-Based Crew Routing</h4>
                      <p className="text-slate-550 text-[11.5px] leading-relaxed">The AI dispatch registry maps active primary and secondary municipal crew teams based on specialized skill matrices (Asphalt Leads, Bio-Waste Technicians, Drainage Crews), avoiding blind matching delays.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-550 flex items-center justify-center font-black text-sm shrink-0 shadow-sm text-white">3</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Sovereign Audit Ledger</h4>
                      <p className="text-slate-550 text-[11.5px] leading-relaxed">Every NGO status change, volunteer verification, or bulk CSV upload is processed through AI geodetic validation, preventing fraudulent requests and establishing absolute database integrity.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Interactive Live Municipal Crisis Simulator */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50 text-slate-800 relative overflow-hidden border-b border-slate-100">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-[var(--saffron)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full">
              Live Simulator Deck
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-mukta leading-tight text-slate-900">
              Interactive Municipal Crisis Simulator
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Toggle between three Delhi municipal emergency scenarios to visualize the side-by-side timeline of the Traditional Path versus the Sahaayak Sovereign Path.
            </p>
          </div>

          {/* Scenario Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
            {simulatorScenarios.map((sc, idx) => {
              const IconComp = sc.icon;
              const isActive = selectedScenario === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedScenario(idx)}
                  className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 cursor-pointer ${
                    isActive 
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/10 shadow-lg scale-[1.02]' 
                      : 'bg-white/80 border-slate-150 hover:bg-white hover:border-slate-350'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                      : 'bg-slate-50 border-slate-150 text-slate-400'
                  }`}>
                    <IconComp size={22} className={isActive ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Scenario 0{idx + 1}</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight mt-0.5">{sc.title}</h4>
                    <span className="text-[10px] text-slate-500 block mt-1">{sc.department}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timeline Comparison Board */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedScenario}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto"
            >
              
              {/* Legacy Timeline Column */}
              <div className="bg-white border border-red-100 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="text-red-500" size={20} />
                      <h3 className="text-base font-black tracking-wide uppercase font-mukta text-slate-800">Legacy Public Grievance Path</h3>
                    </div>
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full font-black uppercase">
                      Velocity: {simulatorScenarios[selectedScenario].legacy.totalTime}
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-5 text-left pt-2">
                    {simulatorScenarios[selectedScenario].legacy.steps.map((st, sidx) => (
                      <div key={sidx} className="flex gap-4 items-start group">
                        <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 text-red-650 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                          {sidx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{st.title}</p>
                          <p className="text-[11px] text-slate-550 leading-relaxed">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50/50 border border-red-100/80 p-4 rounded-2xl flex items-center gap-3">
                  <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                    Result: Duplicate citizen requests flood the registry, departments trade jurisdictions, and volunteer relief groups operate in the dark, leading to delayed municipal resolutions.
                  </p>
                </div>

              </div>

              {/* Sahaayak Sovereign Timeline Column */}
              <div className="bg-white border border-emerald-250 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-md ring-1 ring-emerald-50">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <h3 className="text-base font-black tracking-wide uppercase font-mukta text-slate-800">Sahaayak AI & GIS Path</h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase">
                      Velocity: {simulatorScenarios[selectedScenario].sahaayak.totalTime}
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-5 text-left pt-2">
                    {simulatorScenarios[selectedScenario].sahaayak.steps.map((st, sidx) => (
                      <div key={sidx} className="flex gap-4 items-start group">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                          {sidx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{st.title}</p>
                          <p className="text-[11px] text-slate-550 leading-relaxed">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <Sparkles size={16} className="text-emerald-500 shrink-0 animate-pulse" />
                  <p className="text-[11px] text-emerald-850 leading-relaxed font-semibold">
                    Result: AI automates verification and routing instantly, matching skill assets to the issue coordinate while NGOs operate in sync, minimizing resolution delays.
                  </p>
                </div>

              </div>

            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* Comparison Grid Section */}
      <section className="py-24 bg-white border-b border-slate-100 transition-colors duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[var(--saffron)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Technical Comparison
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-mukta text-slate-900 leading-tight">
              Sahaayak vs. Legacy Portals
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Why traditional grievance portals fall short, and how Sahaayak redefines smart city administration.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Column A: Traditional Grievance Portals */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between space-y-8 shadow-sm transition-colors duration-300">
              <div className="space-y-4">
                <span className="text-[8px] font-mono text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Legacy Paradigm
                </span>
                <h3 className="text-lg font-black font-mukta text-slate-800 leading-tight">Traditional Portals</h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                  Standard government complaint boxes and static HTML grievance sites focus on paperwork filing rather than active logistics.
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex gap-2 text-left">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700">Reactive Form Filling</p>
                      <p className="text-[10px] text-slate-400">Requires manual report filing; no remote satellite scanning or predictive environmental warnings.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700">Manual Sorting</p>
                      <p className="text-[10px] text-slate-400">Bureaucratic sorting by department clerks leads to long queues, misallocations, and weeks of delays.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700">Zero Grassroots Link</p>
                      <p className="text-[10px] text-slate-400">NGOs, CSRs, and local relief operations are isolated, causing duplicates and geographic gaps.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700">Opaque Ticket Closures</p>
                      <p className="text-[10px] text-slate-400">Closed-door resolutions; citizens and field crews are left with zero real-time verification or telemetry updates.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/40 border border-red-100 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-mono text-red-500 font-black uppercase tracking-wider block">RESPONSE VELOCITY</span>
                <span className="text-xs font-bold text-slate-650 block mt-1">2 - 4 Weeks (Average)</span>
              </div>
            </div>

            {/* Column B: Sahaayak Core Platform (Highlight card) */}
            <div className="bg-white border border-emerald-250 rounded-[2rem] p-6 flex flex-col justify-between space-y-8 shadow-md relative overflow-hidden ring-2 ring-emerald-50/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-4 text-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={9} className="text-emerald-600 animate-pulse" /> AI & GIS Sovereign Paradigm
                  </span>
                  <span className="text-[8px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Rajkot Ready</span>
                </div>
                <h3 className="text-lg font-black font-mukta text-slate-900 leading-tight">Sahaayak Operations Suite</h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                  A proactive, unified municipal command console powered by server-side AI, GEE GIS maps, and sovereign field dispatch.
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex gap-2 text-left">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-850">Proactive Remote Sensing</p>
                      <p className="text-[10px] text-slate-500">Scans satellite regions and weather parameters automatically to flag anomalies before complaints are filed.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-850">Autonomous AI Routing</p>
                      <p className="text-[10px] text-slate-500">Directly maps incident departments and dispatches skilled crew workers from real registries in seconds.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-850">Sovereign Collaboration</p>
                      <p className="text-[10px] text-slate-500">Unites NGOs and Municipal departments in a shared geodetic map dashboard, with government override control.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-left">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-850">Public Audit Ledger</p>
                      <p className="text-[10px] text-slate-500">Ensures transparent dispatch, volunteer accountability, and status auditing logged securely.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-wider block">RESPONSE VELOCITY</span>
                <span className="text-xs font-bold text-emerald-600 block mt-1">1.2 Hours (Average)</span>
              </div>
            </div>

            {/* Column C: Functional Comparison Grid */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm transition-colors duration-300">
              <div className="space-y-4">
                <span className="text-[8px] font-mono text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Platform Metrics
                </span>
                <h3 className="text-lg font-black font-mukta text-slate-800 leading-tight">Feature Matrix</h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                  A high-level overview of core technological differences and deployment metrics.
                </p>

                <div className="space-y-3 text-xs pt-4 border-t border-slate-100">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500">Multilingual Voice</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Full Support</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500">Live GIS Mapping</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Real-Time Sync</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500">CSV Bulk Verification</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">AI Filtered</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500">Disaster Mode Override</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Instant Lock</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[10px] font-bold text-slate-500">Resource Routing</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Skill-Matched</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl text-center space-y-1 transition-colors">
                <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-wider block">DELHI JURY SIMULATOR</span>
                <Link 
                  href="/government" 
                  className="inline-flex items-center gap-1 text-[10px] font-black text-[#0F766E] uppercase tracking-wide hover:underline mt-1"
                >
                  Explore Command Deck <ArrowRight size={10} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Philosophy / Values Section */}
      <section className="py-24 bg-white border-b border-slate-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 space-y-2">
          <h2 className="text-4xl font-bold font-mukta text-slate-900">Our Core Philosophy</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed font-medium">
            Technology is simply the vehicle. Our core mission is to elevate the human spirit of civic service with the rigor and precision of next-generation database engineering.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl ${value.bg} ${value.color} flex items-center justify-center mb-6 shadow-inner`}>
                    <value.icon size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold font-mukta text-slate-800">{value.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-orange-50/40 via-white to-emerald-50/30 text-slate-800 border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold font-mukta leading-tight text-slate-900">Ready to join the network?</h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto font-semibold leading-relaxed">
            Be part of a smarter, more resilient, and coordinate-perfect future. Register your NGO or sign up as a certified partner.
          </p>
          <div className="flex justify-center">
            <Link href="/join?role=ngo" className="btn-primary px-8 py-3.5 text-sm font-mukta font-extrabold shadow-2xl hover:scale-105 transition-all text-white">
              Register NGO
            </Link>
          </div>
        </div>
        
        {/* Decorative ambient elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--saffron)] opacity-5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-emerald-500 opacity-5 rounded-full blur-3xl" />
      </section>
    </div>
  );
}
