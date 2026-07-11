

import { apiClient } from './client';
import type { ApiResponse, AppNotification } from '../../types';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface MarkAllReadResult {
  updated_count: number;
}

// ── Functions ─────────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<ApiResponse<AppNotification[]>> {
  const response = await apiClient.get<AppNotification[]>(
    '/notifications',
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load notifications.' };
  }
  return { data: response.data, error: null };
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ApiResponse<AppNotification>> {
  const response = await apiClient.patch<AppNotification>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to mark notification as read.' };
  }
  return { data: response.data, error: null };
}

export async function markAllNotificationsAsRead(): Promise<ApiResponse<MarkAllReadResult>> {
  const response = await apiClient.patch<MarkAllReadResult>(
    '/notifications/read-all',
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to mark notifications as read.' };
  }
  return { data: response.data, error: null };
}
