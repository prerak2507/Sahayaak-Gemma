'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getRoleDefaultPath } from '@/lib/utils';
import { Menu, X, Globe, MapPin, Building2, AlertCircle, Info, LogIn, UserPlus, Shield, Eye, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const navLinks = [
    { href: '/map', label: 'Live Map', icon: Globe },
    { href: '/ngos', label: 'NGOs', icon: Building2 },
    { href: '/report', label: 'Report a Need', icon: AlertCircle },
    { href: '/about', label: 'About', icon: Info }
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 no-underline">
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-mukta), system-ui', color: 'var(--saffron)' }}
            >
              Sahaayak
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium no-underline transition-colors hover:opacity-80"
                style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link href={getRoleDefaultPath(user.role)} className="btn-primary text-sm no-underline">
                  Dashboard
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }} 
                  className="btn-ghost text-sm flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-ghost text-sm no-underline whitespace-nowrap">
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-sm"
                  style={{ color: 'var(--ink-muted)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
              <LanguageSwitcher />
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href={getRoleDefaultPath(user?.role || 'volunteer')}
                    className="btn-primary text-sm text-center no-underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      router.push('/login');
                    }}
                    className="btn-ghost text-sm text-center text-red-600 border border-red-200 w-full flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-ghost text-sm text-center no-underline" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
