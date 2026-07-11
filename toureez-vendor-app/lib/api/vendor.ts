

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, PaginatedResponse } from '../../types';
import type {
  VendorCompany,
  CompanyDocument,
  VendorDashboardMetrics,
  VendorPackageListItem,
  VendorPackageDetail,
  VendorPricingTier,
  VendorItineraryDay,
  VendorPackageImage,
  VendorBookingListItem,
  VendorBookingDetail,
  VendorReview,
  VendorPayout,
  VendorPayoutAccount,
  VendorNotification,
  EnquirySummary,
  EnquiryDetail,
  User,
} from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────


function normalise<T>(res: BackendApiResponse<T>): ApiResponse<T> {
  return { data: res.data, error: res.error };
}

// ── Profile ───────────────────────────────────────────────────────────────────


export async function getVendorMe(): Promise<ApiResponse<{ user: User; company: VendorCompany | null }>> {
  const res = await apiClient.get<{ user: User; company: VendorCompany | null }>('/vendor/me');
  return normalise(res);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────


export async function getVendorDashboard(): Promise<ApiResponse<VendorDashboardMetrics>> {
  const res = await apiClient.get<VendorDashboardMetrics>('/vendor/dashboard');
  return normalise(res);
}

export interface VendorMonthlyEarnings {
  month: string;
  revenue: number;
  bookings: number;
}


export async function getVendorEarningsForMonth(month: string): Promise<ApiResponse<VendorMonthlyEarnings>> {
  const res = await apiClient.get<VendorMonthlyEarnings>(`/vendor/earnings?month=${month}`);
  return normalise(res);
}

// ── Company ───────────────────────────────────────────────────────────────────


export async function getCompany(): Promise<ApiResponse<VendorCompany | null>> {
  const res = await apiClient.get<VendorCompany | null>('/vendor/company');
  return normalise(res);
}


export async function createCompany(input: {
  name: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}): Promise<ApiResponse<VendorCompany>> {
  const res = await apiClient.post<VendorCompany>('/vendor/company', input);
  return normalise(res);
}


export async function updateCompany(input: {
  name?: string;
  about?: string;
  gst_number?: string;
  logo_url?: string;
  cover_url?: string;
}): Promise<ApiResponse<VendorCompany>> {
  const res = await apiClient.patch<VendorCompany>('/vendor/company', input);
  return normalise(res);
}


export async function saveCompanyDocument(input: {
  document_type: 'trade_license' | 'gst_certificate' | 'pan_card' | 'other';
  url: string;
  public_id: string;
  label?: string;
}): Promise<ApiResponse<CompanyDocument>> {
  const res = await apiClient.post<CompanyDocument>('/vendor/company/documents', input);
  return normalise(res);
}

// ── Packages ──────────────────────────────────────────────────────────────────


export async function listPackages(params?: {
  status?: 'draft' | 'pending' | 'active' | 'rejected';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorPackageListItem>>> {
  const res = await apiClient.get<PaginatedResponse<VendorPackageListItem>>('/vendor/packages', params as Record<string, string | number | boolean | null | undefined>);
  return normalise(res);
}


export async function getPackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.get<VendorPackageDetail>(`/vendor/packages/${packageId}`);
  return normalise(res);
}


export async function createPackage(input: {
  title: string;
  location_id: string;
  category_id: string;
  description?: string;
  highlights?: string[];
  duration_days?: number;
  duration_nights?: number;
  min_group_size?: number;
  max_group_size?: number;
  inclusions?: string[];
  exclusions?: string[];
  amenities?: string[];
}): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.post<VendorPackageDetail>('/vendor/packages', input);
  return normalise(res);
}


export async function updatePackage(
  packageId: string,
  input: {
    title?: string;
    location_id?: string;
    category_id?: string;
    description?: string;
    highlights?: string[];
    duration_days?: number;
    duration_nights?: number;
    min_group_size?: number;
    max_group_size?: number;
    inclusions?: string[];
    exclusions?: string[];
    amenities?: string[];
  },
): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.patch<VendorPackageDetail>(`/vendor/packages/${packageId}`, input);
  return normalise(res);
}


export async function submitPackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.patch<VendorPackageDetail>(`/vendor/packages/${packageId}/submit`);
  return normalise(res);
}


export async function deletePackage(packageId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${packageId}`);
  return normalise(res);
}


export async function duplicatePackage(packageId: string): Promise<ApiResponse<VendorPackageDetail>> {
  const res = await apiClient.post<VendorPackageDetail>(`/vendor/packages/${packageId}/duplicate`);
  return normalise(res);
}


export async function upsertPricing(
  packageId: string,
  tiers: Array<{
    id?: string;
    label: string;
    min_people: number;
    max_people: number;
    base_price: number;
    discounted_price?: number | null;
    currency?: string;
    season?: 'all' | 'peak' | 'off-peak';
    valid_from?: string | null;
    valid_until?: string | null;
    is_active?: boolean;
  }>,
): Promise<ApiResponse<VendorPricingTier[]>> {
  const res = await apiClient.patch<VendorPricingTier[]>(`/vendor/packages/${packageId}/pricing`, { tiers });
  return normalise(res);
}


export async function upsertItinerary(
  packageId: string,
  days: Array<{
    id?: string;
    day_number: number;
    title: string;
    description?: string;
    meals?: string[];
    accommodation?: string;
    activities?: string[];
    transport?: string;
  }>,
): Promise<ApiResponse<VendorItineraryDay[]>> {
  const res = await apiClient.patch<VendorItineraryDay[]>(`/vendor/packages/${packageId}/itinerary`, { days });
  return normalise(res);
}


export async function savePackageImage(
  packageId: string,
  input: { url: string; public_id: string; alt_text?: string; is_cover?: boolean },
): Promise<ApiResponse<VendorPackageImage>> {
  const res = await apiClient.post<VendorPackageImage>(`/vendor/packages/${packageId}/images`, input);
  return normalise(res);
}


export async function deletePackageImage(
  packageId: string,
  imageId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>(`/vendor/packages/${packageId}/images/${imageId}`);
  return normalise(res);
}


export async function setPackageCoverImage(
  packageId: string,
  imageId: string,
): Promise<ApiResponse<VendorPackageImage>> {
  const res = await apiClient.patch<VendorPackageImage>(`/vendor/packages/${packageId}/images/${imageId}/cover`);
  return normalise(res);
}

// ── Bookings ──────────────────────────────────────────────────────────────────


export async function listBookings(params?: {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  package_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorBookingListItem>>> {
  const res = await apiClient.get<PaginatedResponse<VendorBookingListItem>>(
    '/vendor/bookings',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}


export async function getBooking(bookingId: string): Promise<ApiResponse<VendorBookingDetail>> {
  const res = await apiClient.get<VendorBookingDetail>(`/vendor/bookings/${bookingId}`);
  return normalise(res);
}


export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'completed',
  note?: string,
): Promise<ApiResponse<VendorBookingDetail>> {
  const res = await apiClient.patch<VendorBookingDetail>(`/vendor/bookings/${bookingId}/status`, {
    status,
    note,
  });
  return normalise(res);
}

// ── Reviews ───────────────────────────────────────────────────────────────────


export async function listReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorReview>>> {
  const res = await apiClient.get<PaginatedResponse<VendorReview>>(
    '/vendor/reviews',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}

// ── Enquiries ─────────────────────────────────────────────────────────────────


export async function listEnquiries(): Promise<ApiResponse<EnquirySummary[]>> {
  const res = await apiClient.get<EnquirySummary[]>('/vendor/enquiries');
  return normalise(res);
}


export async function getEnquiry(enquiryId: string): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.get<EnquiryDetail>(`/vendor/enquiries/${enquiryId}`);
  return normalise(res);
}


export async function sendEnquiryMessage(
  enquiryId: string,
  message: string,
): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.post<EnquiryDetail>(`/vendor/enquiries/${enquiryId}/messages`, { message });
  return normalise(res);
}


export async function setEnquiryStatus(
  enquiryId: string,
  status: 'open' | 'closed',
): Promise<ApiResponse<EnquiryDetail>> {
  const res = await apiClient.patch<EnquiryDetail>(`/vendor/enquiries/${enquiryId}/status`, { status });
  return normalise(res);
}

// ── Payouts ───────────────────────────────────────────────────────────────────


export async function listPayouts(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorPayout>>> {
  const res = await apiClient.get<PaginatedResponse<VendorPayout>>(
    '/vendor/payouts',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}


export async function listPayoutAccounts(): Promise<ApiResponse<VendorPayoutAccount[]>> {
  const res = await apiClient.get<VendorPayoutAccount[]>('/vendor/payout-accounts');
  return normalise(res);
}


export async function createPayoutAccount(input: {
  account_holder_name: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  is_primary?: boolean;
}): Promise<ApiResponse<VendorPayoutAccount>> {
  const res = await apiClient.post<VendorPayoutAccount>('/vendor/payout-accounts', input);
  return normalise(res);
}


export const DOMESTIC_REGIONS = ['North India', 'South India', 'East India', 'West India', 'Central India'] as const;
export const INTERNATIONAL_REGIONS = ['Southeast Asia', 'East Asia', 'South Asia', 'Middle East', 'Central Asia', 'Europe', 'Eastern Europe', 'Africa', 'North Africa', 'North America', 'South America', 'Central America', 'Oceania', 'Arctic / Antarctica'] as const;
export type LocationRegion = typeof DOMESTIC_REGIONS[number] | typeof INTERNATIONAL_REGIONS[number];

export async function createLocation(input: {
  city: string;
  state?: string;
  region: LocationRegion;
  country?: string;
}): Promise<ApiResponse<{ id: string; city: string; state: string | null; is_popular: boolean }>> {
  const res = await apiClient.post<{ id: string; city: string; state: string | null; is_popular: boolean }>(
    '/vendor/locations',
    input,
  );
  return normalise(res);
}

// ── Public lookups (no auth required) ────────────────────────────────────────


export async function listLocations(): Promise<ApiResponse<Array<{
  id: string; city: string; state: string; is_popular: boolean;
}>>> {
  const res = await apiClient.get<Array<{ id: string; city: string; state: string; is_popular: boolean }>>(
    '/locations',
    undefined,
    false,
  );
  return normalise(res);
}


export async function listCategories(): Promise<ApiResponse<Array<{
  id: string; name: string; label: string; icon: string;
}>>> {
  const res = await apiClient.get<Array<{ id: string; name: string; label: string; icon: string }>>(
    '/categories',
    undefined,
    false,
  );
  return normalise(res);
}

// ── Notifications ─────────────────────────────────────────────────────────────


export async function listNotifications(params?: {
  is_read?: boolean;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<VendorNotification>>> {
  const res = await apiClient.get<PaginatedResponse<VendorNotification>>(
    '/vendor/notifications',
    params as Record<string, string | number | boolean | null | undefined>,
  );
  return normalise(res);
}


export async function markNotificationRead(
  notificationId: string,
): Promise<ApiResponse<{ marked_read: boolean }>> {
  const res = await apiClient.patch<{ marked_read: boolean }>(
    `/vendor/notifications/${notificationId}/read`,
  );
  return normalise(res);
}


export async function markAllNotificationsRead(): Promise<ApiResponse<{ marked_read: boolean }>> {
  const res = await apiClient.patch<{ marked_read: boolean }>('/vendor/notifications/read-all');
  return normalise(res);
}
