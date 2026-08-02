'use client';

import React from 'react';
import { FileText, Scale, AlertCircle, Users } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)] pt-32 pb-20 font-dm-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-[var(--saffron)] mb-6">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-mukta text-[var(--ink)] mb-4">Terms of Service</h1>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            The rules and guidelines for utilizing the Sahaayak civic engagement platform.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-[var(--ink-muted)]">
            <span>Effective Date: April 21, 2026</span>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[var(--border)] shadow-xl shadow-orange-900/5">
          <div className="prose prose-lg prose-slate max-w-none text-[var(--ink-muted)]">
            
            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <Scale className="text-indigo-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">1. Acceptance of Terms</h2>
                </div>
                <p>
                  By registering an account, accessing, or using the Sahaayak platform (including the web portal, mobile application, and any associated APIs), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <Users className="text-emerald-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">2. Community Code of Conduct</h2>
                </div>
                <p>Sahaayak is built on mutual respect and civic duty. All users (Citizens, Field Engineers, NGOs, and Government Officials) must adhere to the following:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Integrity:</strong> Do not post false incidents, fake resource requirements, or misleading updates.</li>
                  <li><strong>Respect:</strong> Do not engage in harassment, hate speech, or discrimination of any kind towards other users or the communities we serve.</li>
                  <li><strong>Non-Commercial Use:</strong> The platform is strictly for civic and philanthropic engagement. Solicitation, advertising, or spamming is strictly prohibited.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-[var(--ink)]">
                  <AlertCircle className="text-red-500" />
                  <h2 className="text-2xl font-bold font-mukta m-0">3. Liability and Emergency Services</h2>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl border border-red-100 text-red-900">
                  <h3 className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={18}/> NOT A REPLACEMENT FOR EMERGENCY SERVICES</h3>
                  <p className="text-sm">
                    Sahaayak is a supplementary coordination platform. <strong>It is not a replacement for traditional 100 / 101 / 112 emergency services.</strong> If you are experiencing a life-threatening emergency, you must contact local emergency services immediately. Sahaayak and its operators are not liable for delayed responses to incidents posted on the platform.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold font-mukta text-[var(--ink)] mb-4">4. Account Suspension</h2>
                <p>
                  We reserve the right to suspend or permanently terminate accounts that violate these Terms, falsify NGO credentials, misuse the AI dispatch system, or repeatedly fail to show up for accepted volunteer tasks without notice.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-bold font-mukta text-[var(--ink)] mb-4">5. Intellectual Property</h2>
                <p>
                  The Sahaayak platform, its proprietary AI algorithms, and structural databases remain the intellectual property of the Sahaayak Organization. User-generated content (photos, incident descriptions) remains your property, but by posting it, you grant Sahaayak a non-exclusive license to use it for incident resolution and platform analytics.
                </p>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
