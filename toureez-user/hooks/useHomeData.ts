

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { getLocations, getCategories, getFeaturedPackagesFromBackend } from '../lib/api/home';
import { Config } from '../constants/config';
import type { Category, Location, PackageListItem } from '../types';

export const homeQueryKeys = {
  locations: (popular?: boolean) => ['locations', { popular }] as const,
  categories: ['categories'] as const,
  featuredPackages: (tripType?: 'domestic' | 'international') => ['packages', 'featured', tripType] as const,
} as const;

function assertData<T>(data: T | null, error: string | null): T {
  if (error) {
    throw new Error(error);
  }

  if (data === null) {
    throw new Error('The server returned an empty response.');
  }

  return data;
}

export function useLocations(
  popular?: boolean
): UseQueryResult<Location[], Error> {
  return useQuery({
    queryKey: homeQueryKeys.locations(popular),
    queryFn: async () => {
      const response = await getLocations(popular);
      return assertData(response.data, response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 min — locations rarely change
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: homeQueryKeys.categories,
    queryFn: async () => {
      const response = await getCategories();
      return assertData(response.data, response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 min — categories rarely change
    gcTime: Config.queryCacheTimeMs,
  });
}

export function useFeaturedPackages(tripType?: 'domestic' | 'international'): UseQueryResult<
  PackageListItem[],
  Error
> {
  return useQuery({
    queryKey: homeQueryKeys.featuredPackages(tripType),
    queryFn: async () => {
      const response = await getFeaturedPackagesFromBackend(tripType);
      return assertData(response.data, response.error);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: Config.queryCacheTimeMs,
  });
}
