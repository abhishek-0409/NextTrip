/**
 * @file hooks/admin/useAdminBookings.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getAdminBookings, getAdminBooking, updateAdminBookingStatus } from '../../lib/api/admin';
import type { AdminBooking, AdminBookingListParams } from '../../types/admin';
import type { PaginatedResponse } from '../../types';

export const adminBookingQueryKeys = {
  all: ['admin', 'bookings'] as const,
  list: (params: AdminBookingListParams) => ['admin', 'bookings', 'list', params] as const,
  detail: (id: string) => ['admin', 'bookings', 'detail', id] as const,
} as const;

export function useAdminBookings(
  params: AdminBookingListParams = {},
): UseQueryResult<PaginatedResponse<AdminBooking>, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminBookingQueryKeys.list(params),
    queryFn: async () => {
      const res = await getAdminBookings(params);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load bookings');
      return res.data;
    },
    enabled: isAdmin,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useAdminBooking(bookingId: string): UseQueryResult<AdminBooking, Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return useQuery({
    queryKey: adminBookingQueryKeys.detail(bookingId),
    queryFn: async () => {
      const res = await getAdminBooking(bookingId);
      if (res.error || !res.data) throw new Error(res.error ?? 'Booking not found');
      return res.data;
    },
    enabled: isAdmin && bookingId.length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (count, err) => !err.message.includes('not found') && count < 2,
  });
}

export function useUpdateBookingStatus(): UseMutationResult<
  AdminBooking,
  Error,
  { bookingId: string; status: AdminBooking['status']; note?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, status, note }) => {
      const res = await updateAdminBookingStatus(bookingId, status, note);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update booking');
      return res.data;
    },
    onSuccess: (booking) => {
      queryClient.setQueryData(adminBookingQueryKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: adminBookingQueryKeys.all });
    },
  });
}
