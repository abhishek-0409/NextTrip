

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import type { ComparePackage, CompareState } from '../types';


export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareItems: [],


      addToCompare: (pkg: ComparePackage) =>
        set((state) => {
          if (state.compareItems.length >= Config.maxCompareItems) {
            return state; // Tray is full — caller should show a toast
          }
          if (state.compareItems.some((item) => item.id === pkg.id)) {
            return state; // Already in tray — no-op
          }
          return { compareItems: [...state.compareItems, pkg] };
        }),


      removeFromCompare: (packageId: string) =>
        set((state) => ({
          compareItems: state.compareItems.filter(
            (item) => item.id !== packageId
          ),
        })),


      clearCompare: () => set({ compareItems: [] }),


      isInCompare: (packageId: string) =>
        get().compareItems.some((item) => item.id === packageId),
    }),
    {
      name: 'toureez-compare-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
