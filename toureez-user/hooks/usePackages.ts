

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  InfiniteData,
} from '@tanstack/react-query';

import {
  searchPackages,
  getPackageById,
  getFeaturedPackages,
  getPackagesByCategory,
} from '../lib/api/packages';
import { toggleWishlist } from '../lib/api/wishlist';
import { useWishlistStore } from '../store/wishlistStore';
import { Config } from '../constants/config';
import type { Package, PackageImage, PackageCategory, SearchFilters } from '../types';

// ── Query key factories ───────────────────────────────────────────────────────


export const packagesKeys = {
  all: ['packages'] as const,
  lists: () => [...packagesKeys.all, 'list'] as const,
  list: (filters: SearchFilters) => [...packagesKeys.lists(), filters] as const,
  featured: () => [...packagesKeys.all, 'featured'] as const,
  byCategory: (category: PackageCategory) =>
    [...packagesKeys.all, 'category', category] as const,
  details: () => [...packagesKeys.all, 'detail'] as const,
  detail: (id: string) => [...packagesKeys.details(), id] as const,
} as const;


export const wishlistKeys = {
  all: ['wishlist'] as const,
  ids: () => [...wishlistKeys.all, 'ids'] as const,
  packages: () => [...wishlistKeys.all, 'packages'] as const,
} as const;

// ── Package query hooks ───────────────────────────────────────────────────────


export function useFeaturedPackages(): UseQueryResult<Package[], Error> {
  return useQuery({
    queryKey: packagesKeys.featured(),
    queryFn: async () => {
      const { data, error } = await getFeaturedPackages();
      if (error) throw new Error(error);
      return data ?? [];
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}


export function usePackagesByCategory(
  category: PackageCategory,
  limit: number = 10
): UseQueryResult<Package[], Error> {
  return useQuery({
    queryKey: packagesKeys.byCategory(category),
    queryFn: async () => {
      const { data, error } = await getPackagesByCategory(category, limit);
      if (error) throw new Error(error);
      return data ?? [];
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}


export function usePackage(
  packageId: string | null | undefined
): UseQueryResult<Package & { images: PackageImage[] }, Error> {
  return useQuery({
    queryKey: packagesKeys.detail(packageId ?? ''),
    queryFn: async () => {
      if (!packageId) throw new Error('Package ID is required.');
      const { data, error } = await getPackageById(packageId);
      if (error) throw new Error(error);
      if (!data) throw new Error('Package not found.');
      return data;
    },
    enabled: Boolean(packageId),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}


export function useSearchPackages(
  filters: SearchFilters
): UseInfiniteQueryResult<InfiniteData<Package[]>, Error> {
  return useInfiniteQuery({
    queryKey: packagesKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const { data, error } = await searchPackages(filters, page);
      if (error) throw new Error(error);
      return data ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < Config.packagesPageSize) return undefined;
      return allPages.length;
    },
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });
}

// ── Wishlist mutation hook ────────────────────────────────────────────────────


export interface ToggleWishlistVariables {

  packageId: string;

  isCurrentlyWishlisted: boolean;
}


export function useToggleWishlist(): UseMutationResult<
  { wishlisted: boolean },
  Error,
  ToggleWishlistVariables
> {
  const queryClient = useQueryClient();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  return useMutation<{ wishlisted: boolean }, Error, ToggleWishlistVariables>({
    mutationFn: async ({ packageId, isCurrentlyWishlisted }: ToggleWishlistVariables) => {
      const { data, error } = await toggleWishlist(packageId, isCurrentlyWishlisted);
      if (error) throw new Error(error);
      if (!data) throw new Error('Toggle wishlist failed: no response.');
      return data;
    },


    onMutate: ({ packageId, isCurrentlyWishlisted }: ToggleWishlistVariables) => {
      if (isCurrentlyWishlisted) {
        removeFromWishlist(packageId);
      } else {
        addToWishlist(packageId);
      }
      // Return context for rollback in onError
      return { packageId, wasWishlisted: isCurrentlyWishlisted };
    },


    onError: (
      _error: Error,
      _variables: ToggleWishlistVariables,
      context: unknown
    ) => {
      const ctx = context as { packageId: string; wasWishlisted: boolean } | undefined;
      if (!ctx) return;
      // Restore previous state
      if (ctx.wasWishlisted) {
        addToWishlist(ctx.packageId);
      } else {
        removeFromWishlist(ctx.packageId);
      }
    },


    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
