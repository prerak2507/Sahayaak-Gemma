'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useRouteGuard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for initial hydration to complete
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Role-based path guarding
    const segment = pathname.split('/')[1]; // e.g. 'volunteer', 'ngo', 'admin', 'govt'
    
    let isAllowed = false;
    if (segment === 'citizen' && user.role === 'citizen') isAllowed = true;
    if (segment === 'volunteer' && user.role === 'volunteer') isAllowed = true;
    if (segment === 'ngo' && user.role.startsWith('ngo_')) isAllowed = true;
    if (segment === 'admin' && user.role.endsWith('admin')) isAllowed = true;
    if (segment === 'govt' && (user.role === 'govt_officer' || user.role === 'govt_worker' || user.role === 'govt_employee')) isAllowed = true;

    if (!isAllowed) {
      // Redirect to their proper dashboard using the root path redirect logic
      switch (user.role) {
        case 'citizen': router.replace('/citizen/dashboard'); break;
        case 'volunteer': router.replace('/volunteer/dashboard'); break;
        case 'ngo_coordinator':
        case 'ngo_reporter':
        case 'ngo_admin': router.replace('/ngo/dashboard'); break;
        case 'platform_admin':
        case 'super_admin': router.replace('/admin/overview'); break;
        case 'govt_officer':
        case 'govt_worker':
        case 'govt_employee': router.replace('/govt/dashboard'); break;
        default: router.replace('/');
      }
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, user, isLoading, pathname, router]);

  return { isReady, user };
}
