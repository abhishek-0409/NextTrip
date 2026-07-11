

import { apiClient } from './client';
import type { BackendApiResponse, Category, Location, PackageListItem } from '../../types';


export async function getLocations(
  popular?: boolean
): Promise<BackendApiResponse<Location[]>> {
  return apiClient.get<Location[]>(
    '/locations',
    popular !== undefined ? { popular } : undefined
  );
}


export async function getCategories(): Promise<BackendApiResponse<Category[]>> {
  return apiClient.get<Category[]>('/categories');
}


export async function getFeaturedPackagesFromBackend(tripType?: 'domestic' | 'international'): Promise<
  BackendApiResponse<PackageListItem[]>
> {
  const params = tripType ? { trip_type: tripType } : undefined;
  return apiClient.get<PackageListItem[]>('/packages/featured', params);
}
