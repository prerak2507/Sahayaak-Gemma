import Link from 'next/link';
import { SDGBadge } from './SDGBadge';
import { Mail, Globe, Heart, MessageSquare } from 'lucide-react';

export function Footer() {
  const sdgs = ['SDG2', 'SDG3', 'SDG4', 'SDG6', 'SDG10', 'SDG11'];

  return (
    <footer className="bg-[var(--ink)] text-white pt-20 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Col 1 */}
          <div>
            <Link href="/" className="flex items-center gap-1 no-underline mb-4 inline-block">
              <span className="text-2xl font-bold font-mukta text-[var(--saffron)]">Sahaayak</span>
            </Link>
            <p className="text-gray-300 text-sm mb-6 max-w-xs">
              AI-powered civic platform connecting community needs with volunteers in real-time. Built for India.
            </p>
            <div className="flex gap-2 flex-wrap">
              {sdgs.map((sdg) => (
                <div key={sdg} className="scale-75 origin-left">
                  <SDGBadge sdg={sdg} size="small" />
                </div>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold font-mukta text-lg mb-4 text-white">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/map" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Needs Map</Link></li>
              <li><Link href="/ngos" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">NGO Directory</Link></li>
              <li><Link href="/report" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Report a Need</Link></li>
              <li><Link href="/about" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">About Us</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Blog & Stories</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold font-mukta text-lg mb-4 text-white">For Organizations</h4>
            <ul className="space-y-3">
              <li><Link href="/join" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Register NGO</Link></li>
              <li><Link href="/login" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Coordinator Login</Link></li>
              <li><Link href="/impact" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Impact Reports</Link></li>
              <li><Link href="/data-intake" className="text-gray-300 hover:text-[var(--saffron)] transition-colors text-sm">Data Intake API</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold font-mukta text-lg mb-4 text-white">Connect</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-[var(--saffron)] hover:text-white transition-all">
                <Globe size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-[#1DA1F2] hover:text-white transition-all">
                <MessageSquare size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-[#0A66C2] hover:text-white transition-all">
                <Heart size={18} />
              </a>
              <a href="mailto:hello@sahaayak.org" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white hover:text-black transition-all">
                <Mail size={18} />
              </a>
            </div>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Sahaayak. Built with <span className="text-[var(--saffron)]">❤</span> for India.
          </p>
        </div>
      </div>
    </footer>
  );
}
