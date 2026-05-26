/**
 * @file lib/api/client.ts
 * Typed HTTP client — auto-injects Bearer token, handles 401 sign-out.
 */
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../supabase';
import type { BackendApiResponse } from '../../types';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(endpoint: string, params?: QueryParams): string {
  const base = Config.apiBaseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function getAuthHeader(): Record<string, string> {
  const session = useAuthStore.getState().session;
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: { params?: QueryParams; body?: unknown } = {},
): Promise<BackendApiResponse<T>> {
  try {
    const url = buildUrl(endpoint, options.params);
    const headers: Record<string, string> = { Accept: 'application/json', ...getAuthHeader() };

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(url, { method, headers, body });
    const text = await response.text();
    let parsed: unknown;
    try { parsed = text.trim() ? JSON.parse(text) : undefined; } catch { parsed = text; }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' && parsed !== null && 'error' in parsed &&
        typeof (parsed as Record<string, unknown>).error === 'string'
          ? (parsed as { error: string }).error
          : `Request failed with status ${response.status}`;

      if (response.status === 401) {
        void supabase.auth.signOut().then(() => useAuthStore.getState().clearUser());
      }
      return { success: false, data: null, error: message };
    }

    return parsed as BackendApiResponse<T>;
  } catch (err) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: QueryParams, _authenticated = true) =>
    request<T>('GET', endpoint, { params }),
  post: <T>(endpoint: string, body?: unknown, _authenticated = true) =>
    request<T>('POST', endpoint, { body }),
  patch: <T>(endpoint: string, body?: unknown, _authenticated = true) =>
    request<T>('PATCH', endpoint, { body }),
  delete: <T>(endpoint: string, _authenticated = true) =>
    request<T>('DELETE', endpoint),
};
