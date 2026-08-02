'use client';

import { BarChart3, Globe, Heart, Shield, ArrowRight, Download, FileText, PieChart, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RealTimeAuditingWidget from '@/components/impact/RealTimeAuditingWidget';

export default function ImpactPage() {
  // Counted from the reports themselves. These used to read 18K+ lives, 300+
  // NGOs and 2.8K+ field engineers, which were round numbers nobody had ever
  // measured, on a page whose own heading promises transparency.
  const [stats, setStats] = useState<{
    total_needs: number; needs_resolved: number; departments_engaged: number; wards_covered: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setStats(d))
      .catch((err) => console.error('Could not load impact figures:', err));
  }, []);

  const metrics = [
    { label: 'Reports Filed', value: stats ? String(stats.total_needs) : '—', icon: <Heart className="text-red-500" /> },
    { label: 'Reports Closed', value: stats ? String(stats.needs_resolved) : '—', icon: <Shield className="text-blue-500" /> },
    { label: 'Departments Engaged', value: stats ? String(stats.departments_engaged) : '—', icon: <Globe className="text-teal-500" /> },
    { label: 'Wards Covered', value: stats ? String(stats.wards_covered) : '—', icon: <BarChart3 className="text-[var(--saffron)]" /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#0A0A0F] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--saffron)] opacity-10 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600 opacity-10 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold font-mukta mb-6 leading-tight !text-white">
              Measuring Our <span className="text-[var(--saffron)]">Collective Impact</span>
            </h1>
            <p className="text-xl text-gray-400 font-light mb-10 leading-relaxed">
              Transparent, data-driven insights into how Sahaayak is transforming civic engagement across India.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl text-center hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  {m.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold font-mukta mb-1 text-white">{m.value}</div>
                <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDG Alignment */}
      <section className="py-24 bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-4xl font-bold font-mukta mb-6 text-[var(--ink)]">SDG Alignment Framework</h2>
              <p className="text-lg text-[var(--ink-muted)] mb-8">
                Our platform is built to directly contribute to the United Nations Sustainable Development Goals. We track every intervention against specific targets to ensure measurable progress.
              </p>
              
              <div className="space-y-6">
                {[
                  { goal: 'SDG 3: Good Health & Well-being', progress: 85, color: 'bg-green-500' },
                  { goal: 'SDG 4: Quality Education', progress: 70, color: 'bg-red-500' },
                  { goal: 'SDG 11: Sustainable Cities & Communities', progress: 92, color: 'bg-orange-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)]">
                    <div className="flex justify-between items-end mb-3">
                      <p className="font-bold text-[var(--ink)]">{s.goal}</p>
                      <p className="text-[var(--saffron)] font-bold">{s.progress}%</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full mt-8 md:mt-0">
              <RealTimeAuditingWidget />
            </div>
          </div>
        </div>
      </section>

      {/* For Organizations Section */}
      <section className="py-24 bg-white border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <TrendingUp size={48} className="mx-auto mb-6 text-indigo-600" />
          <h2 className="text-4xl font-bold font-mukta mb-6">Are you an Organization?</h2>
          <p className="text-xl text-[var(--ink-muted)] mb-10">
            Generate certified impact reports for your CSR compliance, annual reviews, and stakeholder meetings using our specialized tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              Login to Generate Reports
            </Link>
            <Link 
              href="/join" 
              className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all"
            >
              Register your NGO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
