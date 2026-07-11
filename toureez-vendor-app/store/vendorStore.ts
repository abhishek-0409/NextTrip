

import { create } from 'zustand';
import type { PackageStatus, BookingStatus, PaymentStatus } from '../types';

// ── Package filter state ──────────────────────────────────────────────────────

export interface PackageFilters {
  status?: PackageStatus;
  search?: string;
}

// ── Booking filter state ──────────────────────────────────────────────────────

export interface BookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  from_date?: string;
  to_date?: string;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface VendorStoreState {
  // Package filters
  packageFilters: PackageFilters;
  setPackageFilters: (filters: PackageFilters) => void;
  resetPackageFilters: () => void;

  // Booking filters
  bookingFilters: BookingFilters;
  setBookingFilters: (filters: BookingFilters) => void;
  resetBookingFilters: () => void;

  // Active package being edited (ID only — full data is in React Query)
  activePackageId: string | null;
  setActivePackageId: (id: string | null) => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PACKAGE_FILTERS: PackageFilters = {};
const DEFAULT_BOOKING_FILTERS: BookingFilters = {};

// ── Store ─────────────────────────────────────────────────────────────────────


export const useVendorStore = create<VendorStoreState>((set) => ({
  // ── Package filters ────────────────────────────────────────
  packageFilters: DEFAULT_PACKAGE_FILTERS,

  setPackageFilters: (filters) =>
    set((state) => ({
      packageFilters: { ...state.packageFilters, ...filters },
    })),

  resetPackageFilters: () => set({ packageFilters: DEFAULT_PACKAGE_FILTERS }),

  // ── Booking filters ────────────────────────────────────────
  bookingFilters: DEFAULT_BOOKING_FILTERS,

  setBookingFilters: (filters) =>
    set((state) => ({
      bookingFilters: { ...state.bookingFilters, ...filters },
    })),

  resetBookingFilters: () => set({ bookingFilters: DEFAULT_BOOKING_FILTERS }),

  // ── Active package ─────────────────────────────────────────
  activePackageId: null,
  setActivePackageId: (id) => set({ activePackageId: id }),
}));
