'use client';

import { create } from 'zustand';
import { Profile, UserRole } from '@/types';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  loginAsDemo: (roleOrKey: string) => void;
}

// Demo users for instant login
const DEMO_USERS: Record<string, Profile> = {
  citizen: {
    id: 'demo-citizen-001',
    phone: '+919876543222',
    email: 'citizen@rajkot.gov.in',
    full_name: 'Rahul Sharma',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-citizen-001',
    role: 'citizen',
    preferred_lang: 'en',
    is_active: true,
    trust_points: 50,
    false_reports_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  volunteer: {
    id: 'demo-volunteer-001',
    phone: '+919876543210',
    email: 'arjun@sahaayak.org',
    full_name: 'Arjun Mehta',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-volunteer-001',
    role: 'volunteer',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  ngo_coordinator: {
    id: 'demo-ngo-001',
    phone: '+919876543211',
    email: 'priya@asha-foundation.org',
    full_name: 'Priya Sharma',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-ngo-001',
    role: 'ngo_coordinator',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  platform_admin: {
    id: 'demo-admin-001',
    phone: '+919876543212',
    email: 'vikram@rmc.gov.in',
    full_name: 'Vikram Singh',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-admin-001',
    role: 'platform_admin',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_officer: {
    id: 'demo-govt-001',
    phone: '+919876543213',
    email: 'kavita.patel@gujarat.gov.in',
    full_name: 'Dr. Kavita Patel',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-001',
    role: 'govt_officer',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_pwd: {
    id: 'demo-govt-worker-001',
    phone: '+919876543215',
    email: 'rajesh.kumar@rmc.gov.in',
    full_name: 'Rajesh Kumar (PWD Engineer)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-001',
    role: 'govt_worker',
    department: 'pwd',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_sanitation: {
    id: 'demo-govt-worker-002',
    phone: '+919876543216',
    email: 'anil.mehta@rmc.gov.in',
    full_name: 'Anil Mehta (Sanitation Inspector)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-002',
    role: 'govt_worker',
    department: 'health_sanitation',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_water: {
    id: 'demo-govt-worker-003',
    phone: '+919876543217',
    email: 'sanjay.dave@rmc.gov.in',
    full_name: 'Sanjay Dave (Water Inspector)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-003',
    role: 'govt_worker',
    department: 'water_works',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_drainage: {
    id: 'demo-govt-worker-004',
    phone: '+919876543218',
    email: 'bablu.prasad@rmc.gov.in',
    full_name: 'Bablu Prasad (Sewerage Technician)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-004',
    role: 'govt_worker',
    department: 'drainage',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_electricity: {
    id: 'demo-govt-worker-005',
    phone: '+919876543219',
    email: 'suresh.solanki@rmc.gov.in',
    full_name: 'Suresh Solanki (Lineman Technician)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-005',
    role: 'govt_worker',
    department: 'electricity',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_encroachment: {
    id: 'demo-govt-worker-006',
    phone: '+919876543220',
    email: 'bharat.gohil@rmc.gov.in',
    full_name: 'Bharat Gohil (Encroachment Inspector)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-006',
    role: 'govt_worker',
    department: 'encroachment',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_worker_fire: {
    id: 'demo-govt-worker-007',
    phone: '+919876543221',
    email: 'deva.solanki@rmc.gov.in',
    full_name: 'Deva Solanki (Field Firefighter)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-govt-worker-007',
    role: 'govt_worker',
    department: 'fire_safety',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_employee_pwd: {
    id: 'demo-employee-pwd-1',
    phone: '+919876543230',
    email: 'jayesh.rathod@rmc.gov.in',
    full_name: 'Jayesh Rathod (PWD Field Engineer)',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=emp-pwd-1',
    role: 'govt_employee',
    department: 'pwd',
    title: 'Asphalt Maintenance Lead',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_employee_sanitation: {
    id: 'demo-employee-san-1',
    phone: '+919876543231',
    email: 'ramesh.koli@rmc.gov.in',
    full_name: 'Ramesh Koli',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=emp-san-1',
    role: 'govt_employee',
    department: 'health_sanitation',
    title: 'Ward 7 Sanitation Inspector',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  govt_employee_water: {
    id: 'demo-employee-water-1',
    phone: '+919876543232',
    email: 'tushar.trivedi@rmc.gov.in',
    full_name: 'Tushar Trivedi',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=emp-water-1',
    role: 'govt_employee',
    department: 'water_works',
    title: 'Pipeline Field Assistant',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  super_admin: {
    id: 'demo-super-001',
    phone: '+919876543214',
    email: 'admin@sahaayak.org',
    full_name: 'System Admin',
    avatar_url: null,
    profile_image: 'https://i.pravatar.cc/150?u=demo-super-001',
    role: 'super_admin',
    preferred_lang: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sahaayak_user');
      window.location.href = '/login';
    }
  },

  loginAsDemo: async (roleOrKey) => {
    let user = DEMO_USERS[roleOrKey];
    if (!user) {
      const roleKey = roleOrKey === 'ngo_admin' || roleOrKey === 'ngo_reporter' ? 'ngo_coordinator' : roleOrKey;
      user = DEMO_USERS[roleKey];
    }
    if (user) {
      set({ user, isAuthenticated: true, isLoading: false });
      
      try {
        const { db } = await import('@/lib/firebase/config');
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          user = { ...user, ...docSnap.data() } as any;
        } else {
          await setDoc(docRef, user);
        }
      } catch (err) {
        console.error('Failed to sync user with Firestore', err);
      }

      set({ user, isAuthenticated: true, isLoading: false });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sahaayak_user', JSON.stringify(user));
      }
    }
  },
}));
