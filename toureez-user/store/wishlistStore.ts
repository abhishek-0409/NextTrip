

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location, WishlistState } from '../types';


interface PersistedWishlistState {
  wishlistedIdsArray: string[];
  wishlistedDestinationIdsArray?: string[];
  wishlistedDestinations?: Location[];
}


export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistedIds: new Set<string>(),
      wishlistedDestinationIds: new Set<string>(),
      wishlistedDestinations: [],


      addToWishlist: (packageId: string) =>
        set((state) => ({
          wishlistedIds: new Set([...state.wishlistedIds, packageId]),
        })),


      removeFromWishlist: (packageId: string) =>
        set((state) => {
          const next = new Set(state.wishlistedIds);
          next.delete(packageId);
          return { wishlistedIds: next };
        }),


      addDestinationToWishlist: (destination: Location) =>
        set((state) => ({
          wishlistedDestinationIds: new Set([
            ...state.wishlistedDestinationIds,
            destination.id,
          ]),
          wishlistedDestinations: [
            destination,
            ...state.wishlistedDestinations.filter(
              (item) => item.id !== destination.id
            ),
          ],
        })),


      removeDestinationFromWishlist: (destinationId: string) =>
        set((state) => {
          const next = new Set(state.wishlistedDestinationIds);
          next.delete(destinationId);

          return {
            wishlistedDestinationIds: next,
            wishlistedDestinations: state.wishlistedDestinations.filter(
              (destination) => destination.id !== destinationId
            ),
          };
        }),


      toggleDestinationWishlist: (destination: Location) => {
        if (get().wishlistedDestinationIds.has(destination.id)) {
          get().removeDestinationFromWishlist(destination.id);
          return;
        }

        get().addDestinationToWishlist(destination);
      },


      setWishlist: (packageIds: string[]) =>
        set({ wishlistedIds: new Set(packageIds) }),


      isWishlisted: (packageId: string) => get().wishlistedIds.has(packageId),


      isDestinationWishlisted: (destinationId: string) =>
        get().wishlistedDestinationIds.has(destinationId),
    }),
    {
      name: 'toureez-wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        wishlistedIdsArray: [...state.wishlistedIds],
        wishlistedDestinationIdsArray: [...state.wishlistedDestinationIds],
        wishlistedDestinations: state.wishlistedDestinations,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedWishlistState;
        const destinations = persisted.wishlistedDestinations ?? [];
        const destinationIds =
          persisted.wishlistedDestinationIdsArray ??
          destinations.map((destination) => destination.id);

        return {
          ...currentState,
          wishlistedIds: new Set(persisted.wishlistedIdsArray ?? []),
          wishlistedDestinationIds: new Set(destinationIds),
          wishlistedDestinations: destinations,
        };
      },
    }
  )
);
