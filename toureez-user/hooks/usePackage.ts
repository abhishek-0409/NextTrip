

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { getPackageDetail } from '../lib/api/packages';
import { Config } from '../constants/config';
import type { PackageDetail } from '../types';

// ── Query key factory ─────────────────────────────────────────────────────────

export const packageQueryKeys = {
  all: ['package'] as const,
  detail: (id: string) => ['package', id] as const,
} as const;

// ── Hook ──────────────────────────────────────────────────────────────────────


export function usePackageDetail(
  id: string
): UseQueryResult<PackageDetail, Error> {
  return useQuery({
    queryKey: packageQueryKeys.detail(id),
    queryFn: async () => {
      if (!id || id.trim() === '') {
        throw new Error('Package ID is required.');
      }

      const { data, error } = await getPackageDetail(id);

      if (error) {
        throw new Error(error);
      }

      if (!data) {
        throw new Error('Package not found.');
      }

      return data;
    },
    enabled: Boolean(id && id.trim().length > 0),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (failureCount, error) => {
      // Don't retry 404s — the package genuinely doesn't exist
      if (error.message.includes('not found') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
