'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as hotToast from 'react-hot-toast';
const { toast, Toaster } = hotToast;
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { GlobalTranslator } from '@/components/shared/GlobalTranslator';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const setUser = useAuthStore((s) => s.setUser);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sahaayak_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [setUser]);

  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + Z shortcut
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        console.log('Ctrl + Shift + Z detected, redirecting...');
        toast('Redirecting to Admin Portal...', { icon: '🛡️' });
        window.location.href = '/login';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalTranslator />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1C1917',
            color: '#FAFAF9',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-dm-sans), system-ui',
          },
          success: {
            iconTheme: { primary: '#FF6B35', secondary: '#FFF' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
