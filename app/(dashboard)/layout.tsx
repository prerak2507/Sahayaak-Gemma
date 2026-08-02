'use client';

import { Sidebar } from '@/components/shared/Sidebar';
import { GlobalBroadcastBanner } from '@/components/shared/GlobalBroadcastBanner';
import { useUIStore } from '@/stores/uiStore';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { Suspense, useState, useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = mounted && typeof window !== 'undefined' && window.location.pathname.includes('/admin/super');
  
  // Ensure route protection client-side
  useRouteGuard();

  if (isSuperAdmin) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#020617]">
        <GlobalBroadcastBanner />
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative h-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-2)]">
      <GlobalBroadcastBanner />
      {!isSuperAdmin && mounted && <Sidebar />}
      <main 
        className={`flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300 relative ${!isSuperAdmin && !sidebarCollapsed ? 'md:ml-[260px]' : isSuperAdmin ? 'md:ml-0' : 'md:ml-[64px]'}`}
      >
        <Suspense fallback={<div className="p-8 w-full h-full flex justify-center items-center"><div className="w-8 h-8 rounded-full border-t-2 border-[var(--saffron)] animate-spin" /></div>}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 h-full">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
