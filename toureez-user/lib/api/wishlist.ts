

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, PackageListItem } from '../../types';

export interface WishlistMutationResult {
  package_id: string;
  wishlisted: boolean;
}

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}
export async function getWishlist(): Promise<ApiResponse<PackageListItem[]>> {
  const response = await apiClient.get<PackageListItem[]>('/wishlist', undefined, true);
  return toApiResponse(response);
}
export async function getWishlistIds(): Promise<ApiResponse<string[]>> {
  const response = await getWishlist();

  if (response.error) {
    return { data: null, error: response.error };
  }

  return {
    data: (response.data ?? []).map((pkg) => pkg.id),
    error: null,
  };
}
export async function addToWishlist(
  packageId: string
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.post<WishlistMutationResult>(
    '/wishlist',
    { package_id: packageId },
    true
  );
  return toApiResponse(response);
}
export async function removeFromWishlist(
  packageId: string
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.delete<WishlistMutationResult>(
    `/wishlist/${encodeURIComponent(packageId)}`,
    true
  );
  return toApiResponse(response);
}
export async function toggleWishlist(
  packageId: string,
  _isCurrentlyWishlisted: boolean
): Promise<ApiResponse<WishlistMutationResult>> {
  const response = await apiClient.post<WishlistMutationResult>(
    '/wishlist/toggle',
    { package_id: packageId },
    true
  );

  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Toggle wishlist failed.' };
  }

  return { data: response.data, error: null };
}
