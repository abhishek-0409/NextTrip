

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getVendorDashboard, getVendorEarningsForMonth, type VendorMonthlyEarnings } from '../lib/api/vendor';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE, type VendorDashboardMetrics } from '../types';
import { Config } from '../constants/config';

export const vendorDashboardQueryKeys = {
  all: ['vendor', 'dashboard'] as const,
  earnings: (month: string) => ['vendor', 'earnings', month] as const,
} as const;


export function useVendorDashboard(): UseQueryResult<VendorDashboardMetrics, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);

  return useQuery({
    queryKey: vendorDashboardQueryKeys.all,
    queryFn: async () => {
      const { data, error } = await getVendorDashboard();
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load dashboard');
      return data;
    },
    enabled: isVendor,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}


export function useVendorEarningsForMonth(month: string): UseQueryResult<VendorMonthlyEarnings, Error> {
  const isVendor = useAuthStore((s) => s.user?.role === VENDOR_ROLE);
  const isValidMonth = /^\d{4}-\d{2}$/.test(month);

  return useQuery({
    queryKey: vendorDashboardQueryKeys.earnings(month),
    queryFn: async () => {
      const { data, error } = await getVendorEarningsForMonth(month);
      if (error !== null || data === null) throw new Error(error ?? 'Failed to load earnings');
      return data;
    },
    enabled: isVendor && isValidMonth,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}
