

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../lib/api/admin';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';
import type { AdminNotification } from '../../types';

// /notifications returns a plain array, not a paginated response.
export const adminNotificationQueryKeys = {
  all: ['admin', 'notifications'] as const,
} as const;

export function useAdminNotifications(): UseQueryResult<AdminNotification[], Error> {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return useQuery({
    queryKey: adminNotificationQueryKeys.all,
    queryFn: async () => {
      const { data, error } = await getAdminNotifications();
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to load notifications');
      }
      return data;
    },
    enabled: isAdmin,
    staleTime: 60_000,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useAdminUnreadCount(): number {
  const query = useAdminNotifications();
  if (!Array.isArray(query.data)) return 0;
  return query.data.filter((n) => !n.is_read).length;
}

export function useMarkAdminNotificationRead(): UseMutationResult<
  { marked_read: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await markAdminNotificationRead(notificationId);
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to mark notification read');
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminNotificationQueryKeys.all });
    },
  });
}

export function useMarkAllAdminNotificationsRead(): UseMutationResult<
  { marked_read: boolean },
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await markAllAdminNotificationsRead();
      if (error !== null || data === null) {
        throw new Error(error ?? 'Failed to mark all notifications read');
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminNotificationQueryKeys.all });
    },
  });
}
