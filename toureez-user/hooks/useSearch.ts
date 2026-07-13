

import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';

import { apiClient } from '../lib/api/client';
import { smartSearchPackages } from '../lib/api/packages';
import type { PackageListItem, PaginatedResponse } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const SEARCH_STALE_TIME_MS = 2 * 60 * 1000; // 2 minutes

// ── Sort options ──────────────────────────────────────────────────────────────

export type SortOption =
  | 'best_match'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
];

// ── Duration bucket helpers ───────────────────────────────────────────────────

export type DurationBucket = '1-3' | '4-6' | '7-10' | '10+';

export const DURATION_BUCKETS: { value: DurationBucket; label: string }[] = [
  { value: '1-3', label: '1–3 Nights' },
  { value: '4-6', label: '4–6 Nights' },
  { value: '7-10', label: '7–10 Nights' },
  { value: '10+', label: '10+ Nights' },
];


export function durationBucketToRange(bucket: DurationBucket): {
  min: number;
  max: number | null;
} {
  switch (bucket) {
    case '1-3':
      return { min: 1, max: 3 };
    case '4-6':
      return { min: 4, max: 6 };
    case '7-10':
      return { min: 7, max: 10 };
    case '10+':
      return { min: 11, max: null };
  }
}

// ── Filter types ──────────────────────────────────────────────────────────────


export type TripType = 'domestic' | 'international';

export interface SearchScreenFilters {
  destination?: string;
  state?: string;
  trip_type?: TripType;
  category?: string;
  min_price?: number;
  max_price?: number;

  duration_bucket?: DurationBucket;
  min_rating?: number;
  is_featured?: boolean;
  sort?: SortOption;
}


export function filtersToQueryParams(
  filters: SearchScreenFilters,
  page: number
): Record<string, string | number | boolean | null | undefined> {
  const params: Record<string, string | number | boolean | null | undefined> = {
    page,
    limit: PAGE_SIZE,
  };

  if (filters.destination?.trim()) {
    params.destination = filters.destination.trim();
  }

  if (filters.state?.trim()) {
    params.state = filters.state.trim();
  }

  if (filters.trip_type) {
    params.trip_type = filters.trip_type;
  }

  if (filters.category?.trim()) {
    params.category = filters.category.trim();
  }

  if (filters.min_price !== undefined) {
    params.min_price = filters.min_price;
  }

  if (filters.max_price !== undefined) {
    params.max_price = filters.max_price;
  }

  if (filters.duration_bucket) {
    const range = durationBucketToRange(filters.duration_bucket);
    // Backend accepts duration_days as an exact value — we use the min of the
    // bucket as a gte proxy. A future backend update can add duration_min/max.
    params.duration_days = range.min;
  }

  if (filters.min_rating !== undefined) {
    params.min_rating = filters.min_rating;
  }

  if (filters.is_featured !== undefined) {
    params.is_featured = filters.is_featured;
  }

  return params;
}

// ── Query key factory ─────────────────────────────────────────────────────────

export const searchQueryKeys = {
  all: ['packages', 'search'] as const,
  list: (filters: SearchScreenFilters) =>
    [...searchQueryKeys.all, filters] as const,
} as const;

// ── Hook ──────────────────────────────────────────────────────────────────────

export type SearchInfiniteData = InfiniteData<PaginatedResponse<PackageListItem>>;


export function useInfiniteSearch(
  filters: SearchScreenFilters
): UseInfiniteQueryResult<SearchInfiniteData, Error> {
  return useInfiniteQuery<
    PaginatedResponse<PackageListItem>,
    Error,
    SearchInfiniteData,
    ReturnType<typeof searchQueryKeys.list>,
    number
  >({
    queryKey: searchQueryKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const params = filtersToQueryParams(filters, pageParam);

      const response = await apiClient.get<PaginatedResponse<PackageListItem>>(
        '/packages',
        params,
        false
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        // Backend returned success:true but data:null — treat as empty page
        return { items: [], total: 0, page: pageParam, limit: PAGE_SIZE, has_more: false };
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      return lastPage.page + 1;
    },
    staleTime: SEARCH_STALE_TIME_MS,
    gcTime: 5 * 60 * 1000,
  });
}

// ── Smart (natural-language) search ──────────────────────────────────────────

export const smartSearchQueryKeys = {
  all: ['packages', 'smart-search'] as const,
  list: (query: string) => [...smartSearchQueryKeys.all, query] as const,
} as const;

export type SmartSearchInfiniteData = InfiniteData<PaginatedResponse<PackageListItem>>;

export function useSmartSearch(
  query: string
): UseInfiniteQueryResult<SmartSearchInfiniteData, Error> {
  return useInfiniteQuery<
    PaginatedResponse<PackageListItem>,
    Error,
    SmartSearchInfiniteData,
    ReturnType<typeof smartSearchQueryKeys.list>,
    number
  >({
    queryKey: smartSearchQueryKeys.list(query),
    queryFn: async ({ pageParam }) => {
      const response = await smartSearchPackages(query, pageParam, PAGE_SIZE);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        return { items: [], total: 0, page: pageParam, limit: PAGE_SIZE, has_more: false };
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    enabled: query.trim().length > 0,
    staleTime: SEARCH_STALE_TIME_MS,
    gcTime: 5 * 60 * 1000,
  });
}

// ── Derived data helpers ──────────────────────────────────────────────────────


export function flattenSearchPages(
  data: SearchInfiniteData | undefined
): PackageListItem[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}


export function getSearchTotal(data: SearchInfiniteData | undefined): number {
  return data?.pages[0]?.total ?? 0;
}

// ── Active filter count helper ────────────────────────────────────────────────


export function countActiveFilters(filters: SearchScreenFilters): number {
  let count = 0;

  if (filters.destination?.trim()) count += 1;
  if (filters.state?.trim()) count += 1;
  if (filters.trip_type) count += 1;
  if (filters.category?.trim()) count += 1;
  if (filters.min_price !== undefined || filters.max_price !== undefined) count += 1;
  if (filters.duration_bucket) count += 1;
  if (filters.min_rating !== undefined) count += 1;
  if (filters.is_featured) count += 1;

  return count;
}

// ── Re-export PaginatedResponse so it's available from this module ────────────
export type { PaginatedResponse };
