'use client';

import React from 'react';
import { Shield, Lock, Eye, Server, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)] pt-32 pb-20 font-dm-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-mukta text-[var(--ink)] mb-4">Privacy Policy</h1>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            Your privacy is critically important to us. This policy outlines how Sahaayak handles your data to maintain a secure and trustworthy civic platform.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-[var(--ink-muted)]">
            <span>Last Updated: April 21, 2026</span>
            <span>•</span>
            <span>Version 2.4</span>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[var(--border)] shadow-xl shadow-blue-900/5">
          <div className="prose prose-lg prose-slate max-w-none text-[var(--ink-muted)]">
            
            <p className="lead text-xl text-[var(--ink)] font-medium mb-8">
              At Sahaayak, we bridge the gap between citizens, NGOs, and the government. To orchestrate this safely, we collect specific data points. We believe in absolute transparency regarding what we collect and why.
            </p>

            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <Eye className="text-blue-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">1. Information We Collect</h2>
                </div>
                <p>We only collect data that is strictly necessary for the operation of the Sahaayak platform:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Account Information:</strong> Name, phone number, and email address for secure authentication and communication.</li>
                  <li><strong>Geolocation Data:</strong> Real-time or approximate location data (with your explicit permission) to route you to nearby incidents or verify on-ground task completion.</li>
                  <li><strong>Verification Documents:</strong> For NGOs and Government officials, we temporarily process official IDs and certificates during the onboarding verification process.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <Server className="text-indigo-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">2. How We Use Your Data</h2>
                </div>
                <p>Your data is the fuel that powers our AI dispatch engine. Specifically, we use it to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Match citizen volunteers with the nearest verified needs.</li>
                  <li>Prevent fraud and duplicate incident reporting through spatial analysis.</li>
                  <li>Generate anonymized civic impact reports for government bodies and participating NGOs.</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
                  <strong>Zero-Sell Guarantee:</strong> Sahaayak operates as a public utility platform. We will <strong>never</strong> sell, rent, or lease your personal data to advertisers or third-party data brokers.
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <Lock className="text-emerald-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">3. Data Security & AI Processing</h2>
                </div>
                <p>
                  All data transmitted to and from Sahaayak is encrypted using industry-standard TLS protocols. Data at rest is encrypted using AES-256 within our secure cloud infrastructure.
                </p>
                <p className="mt-4">
                  <strong>AI Moderation:</strong> Our platform uses advanced AI models to score urgency and moderate incident reports. Your personally identifiable information (PII) is completely stripped before any incident text is processed by our machine learning pipelines.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold font-mukta text-[var(--ink)] mb-4">4. Your Rights</h2>
                <p>Under applicable data protection laws, you retain full rights over your data:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Right to Access:</strong> You can request an export of all your data.</li>
                  <li><strong>Right to Erasure:</strong> You can permanently delete your account and associated telemetry data at any time via the Settings panel.</li>
                </ul>
              </section>
            </div>

            <div className="mt-16 pt-8 border-t border-[var(--border)] bg-slate-50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-[var(--ink)] flex items-center gap-2 mb-2">
                  <Mail size={18} className="text-[var(--saffron)]" /> Contact the Privacy Team
                </h3>
                <p className="text-sm">Have questions about how your data is handled?</p>
              </div>
              <a href="mailto:privacy@sahaayak.org" className="px-6 py-3 bg-[var(--ink)] text-white rounded-xl font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">
                privacy@sahaayak.org
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
