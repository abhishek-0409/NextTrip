/**
 * @file services/adminService.ts
 * @description All database operations for the admin portal.
 *
 * Covers:
 *  - Dashboard analytics
 *  - User management (list, detail, role update)
 *  - Vendor (company) management (list, detail, approve, reject, verify)
 *  - Package moderation (list, detail, approve, reject, feature, bestseller)
 *  - Booking management (list, detail, status update)
 *  - Review moderation (list, publish, unpublish, verify)
 *  - Category CRUD
 *  - Location CRUD
 *
 * All DB access uses supabaseAdmin (service role) so RLS is bypassed
 * intentionally. Auth/role guards are enforced at the route layer.
 */

import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import type {
  Category,
  Location,
  Package,
  PaginatedResponse,
  Review,
  User,
} from '../types';
import type {
  AdminCreateCategoryInput,
  AdminCreateLocationInput,
  AdminUpdateCategoryInput,
  AdminUpdateLocationInput,
} from '../utils/adminValidation';

// ── Safe accessor helpers ─────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toRecord = (v: unknown): Record<string, unknown> =>
  isRecord(v) ? v : Array.isArray(v) && isRecord(v[0]) ? (v[0] as Record<string, unknown>) : {};

const readString = (r: Record<string, unknown>, k: string, fb = ''): string =>
  typeof r[k] === 'string' ? (r[k] as string) : fb;

const readNullableString = (r: Record<string, unknown>, k: string): string | null =>
  typeof r[k] === 'string' ? (r[k] as string) : null;

const readNumber = (r: Record<string, unknown>, k: string, fb = 0): number => {
  const v = r[k];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const p = Number.parseFloat(v);
    return Number.isFinite(p) ? p : fb;
  }
  return fb;
};

const readBoolean = (r: Record<string, unknown>, k: string, fb = false): boolean =>
  typeof r[k] === 'boolean' ? (r[k] as boolean) : fb;

const readArray = (r: Record<string, unknown>, k: string): unknown[] =>
  Array.isArray(r[k]) ? (r[k] as unknown[]) : [];

const throwDb = (op: string, err: unknown): never => {
  console.error(`[adminService.${op}]`, err);
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapUser = (row: Record<string, unknown>): User => ({
  id: readString(row, 'id'),
  full_name: readNullableString(row, 'full_name'),
  avatar_url: readNullableString(row, 'avatar_url'),
  phone: readNullableString(row, 'phone'),
  city: readNullableString(row, 'city'),
  state: readNullableString(row, 'state'),
  role: readString(row, 'role', 'traveler') as User['role'],
  created_at: readString(row, 'created_at'),
  updated_at: readString(row, 'updated_at') || readString(row, 'created_at'),
});

export interface AdminVendor {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  about: string | null;
  gst_number: string | null;
  trade_license_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_packages: number;
  created_at: string;
  owner?: { full_name: string | null; email: string; phone: string | null };
}

const mapVendor = (row: Record<string, unknown>): AdminVendor => {
  const ownerRaw = toRecord(row['owner']);
  return {
    id: readString(row, 'id'),
    owner_id: readString(row, 'owner_id'),
    name: readString(row, 'name'),
    slug: readString(row, 'slug'),
    logo_url: readNullableString(row, 'logo_url'),
    cover_url: readNullableString(row, 'cover_url'),
    about: readNullableString(row, 'about'),
    gst_number: readNullableString(row, 'gst_number'),
    trade_license_url: readNullableString(row, 'trade_license_url'),
    status: readString(row, 'status', 'pending') as AdminVendor['status'],
    is_verified: readBoolean(row, 'is_verified'),
    avg_rating: readNumber(row, 'avg_rating'),
    total_reviews: readNumber(row, 'total_reviews'),
    total_packages: readNumber(row, 'total_packages'),
    created_at: readString(row, 'created_at'),
    ...(Object.keys(ownerRaw).length > 0
      ? {
          owner: {
            full_name: readNullableString(ownerRaw, 'full_name'),
            email: readString(ownerRaw, 'email'),
            phone: readNullableString(ownerRaw, 'phone'),
          },
        }
      : {}),
  };
};

const mapPackage = (row: Record<string, unknown>): Package => ({
  id: readString(row, 'id'),
  company_id: readString(row, 'company_id'),
  location_id: readString(row, 'location_id'),
  category_id: readString(row, 'category_id'),
  title: readString(row, 'title'),
  slug: readString(row, 'slug'),
  description: readNullableString(row, 'description'),
  highlights: readArray(row, 'highlights') as string[],
  duration_days: readNumber(row, 'duration_days'),
  duration_nights: readNumber(row, 'duration_nights'),
  min_group_size: readNumber(row, 'min_group_size', 1),
  max_group_size: readNumber(row, 'max_group_size', 20),
  inclusions: readArray(row, 'inclusions') as string[],
  exclusions: readArray(row, 'exclusions') as string[],
  amenities: readArray(row, 'amenities') as string[],
  status: readString(row, 'status', 'draft') as Package['status'],
  is_featured: readBoolean(row, 'is_featured'),
  is_bestseller: readBoolean(row, 'is_bestseller'),
  avg_rating: readNumber(row, 'avg_rating'),
  review_count: readNumber(row, 'review_count'),
  total_bookings: readNumber(row, 'total_bookings'),
  created_at: readString(row, 'created_at'),
  updated_at: readString(row, 'updated_at'),
});

const mapReview = (row: Record<string, unknown>): Review => {
  const userRaw = toRecord(row['user']);
  const fullName = readString(userRaw, 'full_name').trim();
  let displayName = 'Anonymous';
  if (fullName.length > 0) {
    const parts = fullName.split(' ').filter(Boolean);
    displayName =
      parts.length >= 2
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
        : (parts[0] ?? 'Anonymous');
  }
  return {
    id: readString(row, 'id'),
    booking_id: readString(row, 'booking_id'),
    user_id: readString(row, 'user_id'),
    package_id: readString(row, 'package_id'),
    rating_guide: row['rating_guide'] != null ? readNumber(row, 'rating_guide') : null,
    rating_hotel: row['rating_hotel'] != null ? readNumber(row, 'rating_hotel') : null,
    rating_food: row['rating_food'] != null ? readNumber(row, 'rating_food') : null,
    rating_transport: row['rating_transport'] != null ? readNumber(row, 'rating_transport') : null,
    rating_value: row['rating_value'] != null ? readNumber(row, 'rating_value') : null,
    overall_rating: readNumber(row, 'overall_rating'),
    title: readNullableString(row, 'title'),
    body: readNullableString(row, 'body'),
    is_verified: readBoolean(row, 'is_verified'),
    is_published: readBoolean(row, 'is_published'),
    created_at: readString(row, 'created_at'),
    user: { display_name: displayName, avatar_url: readNullableString(userRaw, 'avatar_url') },
  };
};

const mapCategory = (row: Record<string, unknown>): Category => ({
  id: readString(row, 'id'),
  name: readString(row, 'name'),
  label: readString(row, 'label'),
  icon: readString(row, 'icon'),
  description: readNullableString(row, 'description'),
  is_active: readBoolean(row, 'is_active', true),
  display_order: readNumber(row, 'display_order'),
  created_at: readString(row, 'created_at'),
});

const mapLocation = (row: Record<string, unknown>): Location => ({
  id: readString(row, 'id'),
  city: readString(row, 'city'),
  state: readString(row, 'state'),
  region: readString(row, 'region'),
  country: readString(row, 'country', 'India'),
  latitude: row['latitude'] != null ? readNumber(row, 'latitude') : null,
  longitude: row['longitude'] != null ? readNumber(row, 'longitude') : null,
  is_popular: readBoolean(row, 'is_popular'),
  is_active: readBoolean(row, 'is_active', true),
  created_at: readString(row, 'created_at'),
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface AdminDashboardMetrics {
  total_users: number;
  new_users_this_month: number;
  total_vendors: number;
  pending_vendors: number;
  total_packages: number;
  pending_packages: number;
  active_packages: number;
  total_bookings: number;
  bookings_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  pending_reviews: number;
  pending_payouts: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    usersRes,
    newUsersRes,
    vendorsRes,
    pendingVendorsRes,
    packagesRes,
    pendingPackagesRes,
    activePackagesRes,
    bookingsRes,
    bookingsMonthRes,
    revenueRes,
    revenueMonthRes,
    pendingReviewsRes,
    pendingPayoutsRes,
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('packages').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('packages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('packages').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabaseAdmin.from('payments').select('amount_paid'),
    supabaseAdmin.from('payments').select('amount_paid').gte('created_at', monthStart),
    supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabaseAdmin.from('vendor_payouts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const sumRevenue = (rows: unknown[] | null): number =>
    ((rows as Array<{ amount_paid?: unknown }> | null) ?? []).reduce((acc, row) => {
      const v = row?.amount_paid;
      if (typeof v === 'number' && Number.isFinite(v)) return acc + v;
      if (typeof v === 'string') {
        const p = Number.parseFloat(v);
        return acc + (Number.isFinite(p) ? p : 0);
      }
      return acc;
    }, 0);

  return {
    total_users: usersRes.count ?? 0,
    new_users_this_month: newUsersRes.count ?? 0,
    total_vendors: vendorsRes.count ?? 0,
    pending_vendors: pendingVendorsRes.count ?? 0,
    total_packages: packagesRes.count ?? 0,
    pending_packages: pendingPackagesRes.count ?? 0,
    active_packages: activePackagesRes.count ?? 0,
    total_bookings: bookingsRes.count ?? 0,
    bookings_this_month: bookingsMonthRes.count ?? 0,
    total_revenue: sumRevenue(revenueRes.data),
    revenue_this_month: sumRevenue(revenueMonthRes.data),
    pending_reviews: pendingReviewsRes.count ?? 0,
    pending_payouts: pendingPayoutsRes.count ?? 0,
  };
}

// ── User management ───────────────────────────────────────────────────────────

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}): Promise<PaginatedResponse<User>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.role) query = query.eq('role', params.role);
  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listUsers', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapUser(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getUserById(userId: string): Promise<User & { email: string; booking_count: number }> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error !== null) throwDb('getUserById', error);
  if (data === null) throw new AppError('User not found', 404);

  // Fetch email from auth.users and booking count
  const [authRes, bookingRes] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const row = toRecord(data);
  return {
    ...mapUser(row),
    email: authRes.data.user?.email ?? '',
    booking_count: bookingRes.count ?? 0,
  };
}

export async function updateUserRole(
  userId: string,
  role: 'traveler' | 'company_owner' | 'admin',
): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error !== null) throwDb('updateUserRole', error);
  if (data === null) throw new AppError('User not found', 404);
  return mapUser(toRecord(data));
}

// ── Vendor management ─────────────────────────────────────────────────────────

export async function listVendors(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  isVerified?: boolean;
}): Promise<PaginatedResponse<AdminVendor>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('companies')
    .select('*, owner:users!owner_id(full_name, email, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.isVerified !== undefined) query = query.eq('is_verified', params.isVerified);
  if (params.search) query = query.ilike('name', `%${params.search}%`);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listVendors', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapVendor(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getVendorById(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*, owner:users!owner_id(full_name, email, phone)')
    .eq('id', vendorId)
    .maybeSingle();

  if (error !== null) throwDb('getVendorById', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return mapVendor(toRecord(data));
}

export async function approveVendor(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select('*, owner:users!owner_id(full_name, email, phone)')
    .single();

  if (error !== null) throwDb('approveVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return mapVendor(toRecord(data));
}

export async function rejectVendor(vendorId: string, reason: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', vendorId)
    .select('*, owner:users!owner_id(full_name, email, phone)')
    .single();

  if (error !== null) throwDb('rejectVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return mapVendor(toRecord(data));
}

export async function verifyVendor(vendorId: string): Promise<AdminVendor> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select('*, owner:users!owner_id(full_name, email, phone)')
    .single();

  if (error !== null) throwDb('verifyVendor', error);
  if (data === null) throw new AppError('Vendor not found', 404);
  return mapVendor(toRecord(data));
}

// ── Package moderation ────────────────────────────────────────────────────────

export interface AdminPackageListItem extends Package {
  cover_image: string | null;
  company: { id: string; name: string; logo_url: string | null };
  location: { id: string; city: string; state: string };
  category: { id: string; name: string; label: string; icon: string };
}

const mapAdminPackage = (row: Record<string, unknown>): AdminPackageListItem => {
  const companyRaw = toRecord(row['company']);
  const locationRaw = toRecord(row['location']);
  const categoryRaw = toRecord(row['category']);
  const imagesRaw = readArray(row, 'images') as Array<Record<string, unknown>>;
  const coverImg = imagesRaw.find((img) => readBoolean(img, 'is_cover'));

  return {
    ...mapPackage(row),
    cover_image: coverImg ? readString(coverImg, 'url') : null,
    company: {
      id: readString(companyRaw, 'id'),
      name: readString(companyRaw, 'name'),
      logo_url: readNullableString(companyRaw, 'logo_url'),
    },
    location: {
      id: readString(locationRaw, 'id'),
      city: readString(locationRaw, 'city'),
      state: readString(locationRaw, 'state'),
    },
    category: {
      id: readString(categoryRaw, 'id'),
      name: readString(categoryRaw, 'name'),
      label: readString(categoryRaw, 'label'),
      icon: readString(categoryRaw, 'icon'),
    },
  };
};

export async function listPackages(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  companyId?: string;
  isFeatured?: boolean;
}): Promise<PaginatedResponse<AdminPackageListItem>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('packages')
    .select(
      `*,
       company:companies(id, name, logo_url),
       location:locations(id, city, state),
       category:categories(id, name, label, icon),
       images:package_images(url, is_cover)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.companyId) query = query.eq('company_id', params.companyId);
  if (params.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listPackages', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapAdminPackage(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getPackageById(packageId: string): Promise<AdminPackageListItem> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select(`
      *,
      company:companies(id, name, logo_url),
      location:locations(id, city, state),
      category:categories(id, name, label, icon),
      images:package_images(url, is_cover, public_id, alt_text, display_order)
    `)
    .eq('id', packageId)
    .maybeSingle();

  if (error !== null) throwDb('getPackageById', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapAdminPackage(toRecord(data));
}

async function recordPackageStatusHistory(
  packageId: string,
  companyId: string,
  oldStatus: string | null,
  newStatus: string,
  changedBy: string,
  reason?: string,
): Promise<void> {
  // Actual schema uses from_status / to_status (not old_status / new_status)
  // and requires company_id (NOT NULL FK to companies).
  const { error } = await supabaseAdmin.from('package_status_history').insert({
    package_id: packageId,
    company_id: companyId,
    from_status: oldStatus,
    to_status: newStatus,
    changed_by: changedBy,
    reason: reason ?? null,
  });
  if (error !== null) {
    console.error('[adminService.recordPackageStatusHistory]', error);
  }
}

export async function approvePackage(
  packageId: string,
  adminId: string,
  note?: string,
): Promise<Package> {
  const existing = await getPackageById(packageId);

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('approvePackage', error);
  if (data === null) throw new AppError('Package not found', 404);

  void recordPackageStatusHistory(packageId, existing.company_id, existing.status, 'active', adminId, note);
  return mapPackage(toRecord(data));
}

export async function rejectPackage(
  packageId: string,
  adminId: string,
  reason: string,
): Promise<Package> {
  const existing = await getPackageById(packageId);

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('rejectPackage', error);
  if (data === null) throw new AppError('Package not found', 404);

  void recordPackageStatusHistory(packageId, existing.company_id, existing.status, 'rejected', adminId, reason);
  return mapPackage(toRecord(data));
}

export async function featurePackage(
  packageId: string,
  isFeatured: boolean,
  isBestseller?: boolean,
): Promise<Package> {
  const updatePayload: Record<string, unknown> = {
    is_featured: isFeatured,
    updated_at: new Date().toISOString(),
  };
  if (isBestseller !== undefined) updatePayload['is_bestseller'] = isBestseller;

  const { data, error } = await supabaseAdmin
    .from('packages')
    .update(updatePayload)
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('featurePackage', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapPackage(toRecord(data));
}

export async function setBestsellerPackage(packageId: string, isBestseller: boolean): Promise<Package> {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .update({ is_bestseller: isBestseller, updated_at: new Date().toISOString() })
    .eq('id', packageId)
    .select()
    .single();

  if (error !== null) throwDb('setBestsellerPackage', error);
  if (data === null) throw new AppError('Package not found', 404);
  return mapPackage(toRecord(data));
}

// ── Booking management ────────────────────────────────────────────────────────

export interface AdminBooking {
  id: string;
  user_id: string;
  package_id: string;
  company_id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  user?: { full_name: string | null; email: string };
  package?: { title: string; duration_days: number; location: { city: string; state: string } };
  company?: { name: string; logo_url: string | null };
}

const mapAdminBooking = (row: Record<string, unknown>): AdminBooking => {
  const userRaw = toRecord(row['user']);
  const pkgRaw = toRecord(row['package']);
  const companyRaw = toRecord(row['company']);
  const locationRaw = toRecord(pkgRaw['location']);

  return {
    id: readString(row, 'id'),
    user_id: readString(row, 'user_id'),
    package_id: readString(row, 'package_id'),
    company_id: readString(row, 'company_id'),
    booking_reference: readString(row, 'booking_reference'),
    travel_date: readString(row, 'travel_date'),
    num_travelers: readNumber(row, 'num_travelers'),
    total_amount: readNumber(row, 'total_amount'),
    advance_amount: readNumber(row, 'advance_amount'),
    balance_amount: readNumber(row, 'balance_amount'),
    status: readString(row, 'status', 'pending') as AdminBooking['status'],
    payment_status: readString(row, 'payment_status', 'pending') as AdminBooking['payment_status'],
    special_requests: readNullableString(row, 'special_requests'),
    created_at: readString(row, 'created_at'),
    updated_at: readString(row, 'updated_at'),
    ...(Object.keys(userRaw).length > 0
      ? { user: { full_name: readNullableString(userRaw, 'full_name'), email: readString(userRaw, 'email') } }
      : {}),
    ...(Object.keys(pkgRaw).length > 0
      ? {
          package: {
            title: readString(pkgRaw, 'title'),
            duration_days: readNumber(pkgRaw, 'duration_days'),
            location: { city: readString(locationRaw, 'city'), state: readString(locationRaw, 'state') },
          },
        }
      : {}),
    ...(Object.keys(companyRaw).length > 0
      ? { company: { name: readString(companyRaw, 'name'), logo_url: readNullableString(companyRaw, 'logo_url') } }
      : {}),
  };
};

export async function listBookings(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  companyId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaginatedResponse<AdminBooking>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('bookings')
    .select(
      `*,
       user:users!user_id(full_name, email),
       package:packages(title, duration_days, location:locations(city, state)),
       company:companies(name, logo_url)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.paymentStatus) query = query.eq('payment_status', params.paymentStatus);
  if (params.companyId) query = query.eq('company_id', params.companyId);
  if (params.fromDate) query = query.gte('travel_date', params.fromDate);
  if (params.toDate) query = query.lte('travel_date', params.toDate);
  if (params.search) query = query.ilike('booking_reference', `%${params.search}%`);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listBookings', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapAdminBooking(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function getBookingById(bookingId: string): Promise<AdminBooking> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      user:users!user_id(full_name, email),
      package:packages(title, duration_days, location:locations(city, state)),
      company:companies(name, logo_url)
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (error !== null) throwDb('getBookingById', error);
  if (data === null) throw new AppError('Booking not found', 404);
  return mapAdminBooking(toRecord(data));
}

export async function updateBookingStatus(
  bookingId: string,
  status: AdminBooking['status'],
  changedBy: string,
  note?: string,
): Promise<AdminBooking> {
  const existing = await getBookingById(bookingId);

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select(`
      *,
      user:users!user_id(full_name, email),
      package:packages(title, duration_days, location:locations(city, state)),
      company:companies(name, logo_url)
    `)
    .single();

  if (error !== null) throwDb('updateBookingStatus', error);
  if (data === null) throw new AppError('Booking not found', 404);

  // Record status event — actual schema uses from_status/to_status/reason and
  // requires company_id (NOT NULL FK to companies).
  const { error: evtErr } = await supabaseAdmin.from('booking_status_events').insert({
    booking_id: bookingId,
    company_id: existing.company_id,
    from_status: existing.status,
    to_status: status,
    changed_by: changedBy,
    reason: note ?? null,
  });
  if (evtErr !== null) console.error('[adminService.updateBookingStatus.event]', evtErr);

  return mapAdminBooking(toRecord(data));
}

// ── Review moderation ─────────────────────────────────────────────────────────

export async function listReviews(params: {
  page: number;
  limit: number;
  search?: string;
  isPublished?: boolean;
  isVerified?: boolean;
  packageId?: string;
  minRating?: number;
}): Promise<PaginatedResponse<Review>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('reviews')
    .select('*, user:users(full_name, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.isPublished !== undefined) query = query.eq('is_published', params.isPublished);
  if (params.isVerified !== undefined) query = query.eq('is_verified', params.isVerified);
  if (params.packageId) query = query.eq('package_id', params.packageId);
  if (params.minRating !== undefined) query = query.gte('overall_rating', params.minRating);

  const { data, error, count } = await query;
  if (error !== null) throwDb('listReviews', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapReview(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function publishReview(reviewId: string): Promise<Review> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ is_published: true })
    .eq('id', reviewId)
    .select('*, user:users(full_name, avatar_url)')
    .single();

  if (error !== null) throwDb('publishReview', error);
  if (data === null) throw new AppError('Review not found', 404);
  return mapReview(toRecord(data));
}

export async function unpublishReview(reviewId: string): Promise<Review> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ is_published: false })
    .eq('id', reviewId)
    .select('*, user:users(full_name, avatar_url)')
    .single();

  if (error !== null) throwDb('unpublishReview', error);
  if (data === null) throw new AppError('Review not found', 404);
  return mapReview(toRecord(data));
}

export async function verifyReview(reviewId: string): Promise<Review> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ is_verified: true })
    .eq('id', reviewId)
    .select('*, user:users(full_name, avatar_url)')
    .single();

  if (error !== null) throwDb('verifyReview', error);
  if (data === null) throw new AppError('Review not found', 404);
  return mapReview(toRecord(data));
}

// ── Category CRUD ─────────────────────────────────────────────────────────────

export async function listAllCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error !== null) throwDb('listAllCategories', error);
  return ((data as unknown[] | null) ?? []).map((r) => mapCategory(toRecord(r)));
}

export async function createCategory(input: AdminCreateCategoryInput): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error !== null) {
    if (error.code === '23505') throw new AppError('Category name already exists', 409);
    throwDb('createCategory', error);
  }
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapCategory(toRecord(data));
}

export async function updateCategory(
  categoryId: string,
  input: AdminUpdateCategoryInput,
): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', categoryId)
    .select()
    .single();

  if (error !== null) throwDb('updateCategory', error);
  if (data === null) throw new AppError('Category not found', 404);
  return mapCategory(toRecord(data));
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', categoryId);
  if (error !== null) {
    if (error.code === '23503') throw new AppError('Category is in use by packages — cannot delete', 409);
    throwDb('deleteCategory', error);
  }
}

// ── Location CRUD ─────────────────────────────────────────────────────────────

export async function listAllLocations(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<PaginatedResponse<Location>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('locations')
    .select('*', { count: 'exact' })
    .order('city', { ascending: true })
    .range(from, to);

  if (params.search) {
    query = query.or(`city.ilike.%${params.search}%,state.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query;
  if (error !== null) throwDb('listAllLocations', error);

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  return {
    items: rows.map((r) => mapLocation(toRecord(r))),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}

export async function createLocation(input: AdminCreateLocationInput): Promise<Location> {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert(input)
    .select()
    .single();

  if (error !== null) throwDb('createLocation', error);
  if (data === null) throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
  return mapLocation(toRecord(data));
}

export async function updateLocation(
  locationId: string,
  input: AdminUpdateLocationInput,
): Promise<Location> {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .update(input as Record<string, unknown>)
    .eq('id', locationId)
    .select()
    .single();

  if (error !== null) throwDb('updateLocation', error);
  if (data === null) throw new AppError('Location not found', 404);
  return mapLocation(toRecord(data));
}

export async function deleteLocation(locationId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('locations').delete().eq('id', locationId);
  if (error !== null) {
    if (error.code === '23503') throw new AppError('Location is in use by packages — cannot delete', 409);
    throwDb('deleteLocation', error);
  }
}
