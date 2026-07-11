
export type UserRole = 'traveler' | 'company_owner' | 'admin';

export const VENDOR_ROLE = 'company_owner' as const;

export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  city: string;
  state: string | null;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  about: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_packages: number;
  created_at: string;
}

export type PackageStatus = 'draft' | 'pending' | 'active' | 'rejected';

export type TripType = 'domestic' | 'international';

export interface Package {
  id: string;
  company_id: string;
  location_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string | null;
  highlights: string[];
  duration_days: number;
  duration_nights: number;
  min_group_size: number;
  max_group_size: number;
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  trip_type: TripType;
  status: PackageStatus;
  is_featured: boolean;
  is_bestseller: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface PackagePricing {
  id: string;
  package_id: string;
  label: string;
  min_people: number;
  max_people: number;
  base_price: number;
  discounted_price: number | null;
  currency: string;
  season: 'all' | 'peak' | 'off-peak';
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface PackageImage {
  id: string;
  package_id: string;
  url: string;
  public_id: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
}

export interface Itinerary {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string | null;
  meals: string[];
  accommodation: string | null;
  activities: string[];
  transport: string | null;
}

export interface PackageDetail extends Package {
  images: PackageImage[];
  itineraries: Itinerary[];
  pricing: PackagePricing[];
  company: Pick<
    Company,
    'id' | 'name' | 'slug' | 'logo_url' | 'is_verified' | 'avg_rating' | 'total_reviews' | 'owner_id'
  >;
  location: Pick<Location, 'id' | 'city' | 'state' | 'region' | 'country'>;
  category: Pick<Category, 'id' | 'name' | 'label' | 'icon'>;
}

export interface Badge {
  type: 'best_value' | 'highest_rated' | 'most_inclusive';
  package_id: string;
}

export interface PackageListItem extends Package {
  cover_image: string | null;
  company: Pick<Company, 'id' | 'name' | 'logo_url' | 'is_verified'>;
  location: Pick<Location, 'id' | 'city' | 'state' | 'country'>;
  category: Pick<Category, 'id' | 'name' | 'label' | 'icon'>;
  pricing: Pick<PackagePricing, 'base_price' | 'discounted_price' | 'currency'>[];
  badges: Badge[];
}

export interface SearchFilters {
  destination?: string;
  state?: string;
  country?: string;
  trip_type?: TripType;
  category?: string;
  min_price?: number;
  max_price?: number;
  duration_days?: number;
  min_rating?: number;
  amenities?: string[];
  is_featured?: boolean;
  sort?: 'best_match' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;

  role: UserRole;
}

export type NotificationType =
  | 'booking_confirmed'
  | 'payment_received'
  | 'review_received'
  | 'package_approved'
  | 'package_rejected'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'wishlist_price_drop'
  | 'booking_received';

export type NotificationRelatedType = 'booking' | 'package' | 'review';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  related_id: string | null;
  related_type: NotificationRelatedType | null;
  is_read: boolean;
  created_at: string;
}

// ── Booking types ─────────────────────────────────────────────────────────────

export interface TravelerDetail {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  id_type: 'aadhaar' | 'passport' | 'driving_license';
  id_number: string;
  is_primary: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  company_id: string;
  pricing_id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
  special_requests: string | null;
  traveler_details: TravelerDetail[];
  created_at: string;
  updated_at: string;
  package?: {
    id: string;
    title: string;
    cover_image: string | null;
    duration_days: number;
    duration_nights: number;
    location: { city: string; state: string };
  };
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  };
  payment?: {
    amount_paid: number;
    payment_method: string | null;
    paid_at: string | null;
    payment_type: 'full' | 'advance';
  };
}

export interface BookingSummary {
  id: string;
  booking_reference: string;
  travel_date: string;
  num_travelers: number;
  total_amount: number;
  status: Booking['status'];
  payment_status: Booking['payment_status'];
  package: {
    id: string;
    title: string;
    cover_image: string | null;
    duration_days: number;
    location: { city: string; state: string };
  };
  company: { name: string; logo_url: string | null };
  created_at: string;
}

export interface CreateBookingInput {
  package_id: string;
  pricing_id: string;
  travel_date: string;
  num_travelers: number;
  special_requests?: string;
  traveler_details: TravelerDetail[];
  payment_type: 'full' | 'advance';
  primary_contact: {
    full_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  } | null;
}

export interface PriceCalculation {
  base_price: number;
  num_travelers: number;
  subtotal: number;
  group_discount: number;
  gst: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  payment_type: 'full' | 'advance';
}

// ── Review types ──────────────────────────────────────────────────────────────

export interface ReviewImage {
  url: string;
  public_id: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  package_id: string;
  rating_guide: number | null;
  rating_hotel: number | null;
  rating_food: number | null;
  rating_transport: number | null;
  rating_value: number | null;
  overall_rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_published: boolean;
  images: ReviewImage[];
  created_at: string;
  user: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface RatingSummary {
  overall: number;
  review_count: number;
  guide: number;
  hotel: number;
  food: number;
  transport: number;
  value: number;
}

export interface CreateReviewInput {
  booking_id: string;
  package_id: string;
  rating_guide?: number;
  rating_hotel?: number;
  rating_food?: number;
  rating_transport?: number;
  rating_value?: number;
  title?: string;
  body?: string;
  images?: ReviewImage[];
}

export interface ReviewEligibility {
  can_review: boolean;
  booking_id?: string;
}

// ── Enquiries ────────────────────────────────────────────────────────────────

export interface EnquiryMessage {
  id: string;
  sender_role: 'user' | 'vendor';
  message: string;
  created_at: string;
}

export interface EnquirySummary {
  id: string;
  package: { id: string; title: string } | null;
  company: { id: string; name: string };
  subject: string;
  status: 'open' | 'closed';
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

export interface EnquiryDetail extends EnquirySummary {
  messages: EnquiryMessage[];
}

export interface CreateEnquiryInput {
  package_id: string;
  message: string;
}
