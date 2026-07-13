

import { apiClient } from './client';
import type { BackendApiResponse, Category, Location, PackageListItem } from '../../types';

export interface HomeFeedSection {
  key: 'for_you' | 'trending' | 'popular';
  title: string;
  packages: PackageListItem[];
}

export interface HomeFeed {
  sections: HomeFeedSection[];
  personalized: boolean;
}


export async function getHomeFeed(): Promise<BackendApiResponse<HomeFeed>> {
  return apiClient.get<HomeFeed>('/home/feed', undefined, true);
}


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
