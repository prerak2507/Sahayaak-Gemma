import { Database, Zap, Shield, Code, ArrowRight, Table, Server, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DataIntakePublicPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#0A0A0F] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500 opacity-10 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600 opacity-10 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Database size={14} /> Enterprise Tools
              </div>
              <h1 className="text-5xl md:text-7xl font-bold font-mukta mb-6 leading-tight !text-white">
                Seamless <span className="text-teal-400">Data Intake</span> for Organizations
              </h1>
              <p className="text-xl text-gray-400 font-light mb-10 leading-relaxed max-w-2xl">
                Connect your legacy systems, survey data, and offline records to the Sahaayak network with our high-speed intake API and bulk upload tools.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link 
                  href="/login" 
                  className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-900/20 flex items-center gap-2"
                >
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link 
                  href="/about" 
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  View Documentation
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg">
              <div className="card bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="text-xs text-gray-500 font-mono ml-2">sahaayak-api-v1</span>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex gap-4 text-teal-400">
                    <span>POST</span>
                    <span className="text-gray-300">/api/v1/needs/bulk</span>
                  </div>
                  <div className="p-4 bg-black/40 rounded-xl text-gray-400 border border-white/5">
                    <pre className="overflow-x-auto text-white">
{`{
  "organization_id": "ngo_789",
  "data": [
    {
      "title": "Water Shortage",
      "city": "Delhi",
      "urgency": 8.5
    }
  ]
}`}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Zap size={14} />
                    <span>200 OK - 152 records synced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Bulk CSV Upload',
                desc: 'Drag and drop large datasets from offline surveys or government records directly into the platform.',
                icon: <Table className="text-teal-600" />,
              },
              {
                title: 'Secure API Access',
                desc: 'Authenticated endpoints for real-time synchronization between your existing CRM and Sahaayak.',
                icon: <Shield className="text-indigo-600" />,
              },
              {
                title: 'Auto-Mapping',
                desc: 'AI-powered column mapping that understands your custom data headers and maps them to our schema.',
                icon: <RefreshCw className="text-teal-600" />,
              },
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-3xl border border-[var(--border)] hover:border-teal-500 transition-all hover:shadow-2xl hover:shadow-teal-100">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold font-mukta mb-4 text-[var(--ink)]">{f.title}</h3>
                <p className="text-[var(--ink-muted)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--surface-2)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Server size={48} className="mx-auto mb-6 text-teal-600" />
          <h2 className="text-4xl font-bold font-mukta mb-6">Ready to Scale Your Impact?</h2>
          <p className="text-lg text-[var(--ink-muted)] mb-10">
            Stop manual data entry. Use our intake tools to focus your team on what matters: serving the community.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--ink)] text-white rounded-2xl font-bold hover:bg-black transition-all"
          >
            Access Organization Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
