

import { create } from 'zustand';
import type { BookingFormState } from '../types';

interface BookingStoreState {
  form: BookingFormState | null;
  setForm: (form: BookingFormState) => void;
  clearForm: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  form: null,


  setForm: (form) => set({ form }),


  clearForm: () => set({ form: null }),
}));
