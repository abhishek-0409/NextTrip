

import { create } from 'zustand';
import type { Href } from 'expo-router';
import { VENDOR_ROLE, type AuthState, type UserRole } from '../types';
export const selectUserRole = (state: AuthState): UserRole | undefined =>
  state.user?.role;

// Central mapping for post-login and cold-start role redirects.
// This is the TRAVELLER app — only travelers are welcome here.
// Vendors  → use Toureez-vendor-app
// Admins   → use Toureez-admin-app
// If either lands here, redirect to login so they can sign out.
export const getHomeRouteForRole = (role: UserRole | null | undefined): Href => {
  if (role === VENDOR_ROLE) return '/(auth)/login' as Href; // no (vendor) group in this app
  return '/(tabs)';
};

// The traveller app only has a (tabs) group — no (vendor) group.
export const getHomeGroupForRole = (
  _role: UserRole | null | undefined
): '(tabs)' => {
  return '(tabs)';
};


export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,


  setUser: (user) => set({ user }),


  setSession: (user, session) => set({ user, session }),


  setLoading: (loading) => set({ isLoading: loading }),


  clearUser: () => set({ user: null, session: null }),
}));
export const useUserRole = (): UserRole | undefined =>
  useAuthStore((state) => state.user?.role);
