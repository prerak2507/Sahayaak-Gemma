'use client';

import { create } from 'zustand';

interface SuperAdminState {
  isActive: boolean;
  isImpersonating: boolean;
  impersonatedUser: { id: string; name: string; role: string } | null;
  showLoginModal: boolean;
  activate: () => void;
  deactivate: () => void;
  setShowLoginModal: (show: boolean) => void;
  startImpersonation: (user: { id: string; name: string; role: string }) => void;
  stopImpersonation: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  isActive: false,
  isImpersonating: false,
  impersonatedUser: null,
  showLoginModal: false,

  activate: () => set({ isActive: true, showLoginModal: false }),
  deactivate: () => set({ isActive: false, isImpersonating: false, impersonatedUser: null }),
  setShowLoginModal: (showLoginModal) => set({ showLoginModal }),
  startImpersonation: (user) => set({ isImpersonating: true, impersonatedUser: user }),
  stopImpersonation: () => set({ isImpersonating: false, impersonatedUser: null }),
}));
