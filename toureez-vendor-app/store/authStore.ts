

import { create } from 'zustand';
import { VENDOR_ROLE, type AuthState, type UserRole } from '../types';
export const selectUserRole = (state: AuthState): UserRole | undefined => state.user?.role;


export const selectIsVendor = (state: AuthState): boolean =>
  state.user?.role === VENDOR_ROLE;


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


export const useIsVendor = (): boolean =>
  useAuthStore((state) => state.user?.role === VENDOR_ROLE);
