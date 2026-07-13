

import { apiClient } from './client';
import type {
  ApiResponse,
  CreateReviewInput,
  PaginatedResponse,
  Review,
  ReviewEligibility,
} from '../../types';

// ── Functions ─────────────────────────────────────────────────────────────────

export async function submitReview(
  input: CreateReviewInput,
): Promise<ApiResponse<Review>> {
  const response = await apiClient.post<Review>('/reviews', input, true);
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to submit review.' };
  }
  return { data: response.data, error: null };
}

export async function getPackageReviews(
  packageId: string,
  page = 1,
  limit = 10,
): Promise<ApiResponse<PaginatedResponse<Review>>> {
  const response = await apiClient.get<PaginatedResponse<Review>>(
    `/reviews/package/${encodeURIComponent(packageId)}`,
    { page, limit },
    false,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load reviews.' };
  }
  return { data: response.data, error: null };
}

export async function getReviewFeed(
  page = 1,
  limit = 10,
): Promise<ApiResponse<PaginatedResponse<Review>>> {
  const response = await apiClient.get<PaginatedResponse<Review>>(
    '/reviews/feed',
    { page, limit },
    false,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to load the community feed.' };
  }
  return { data: response.data, error: null };
}

export async function checkReviewEligibility(
  packageId: string,
): Promise<ApiResponse<ReviewEligibility>> {
  const response = await apiClient.get<ReviewEligibility>(
    `/reviews/eligible/${encodeURIComponent(packageId)}`,
    undefined,
    true,
  );
  if (response.error || !response.data) {
    return { data: null, error: response.error ?? 'Failed to check review eligibility.' };
  }
  return { data: response.data, error: null };
}
