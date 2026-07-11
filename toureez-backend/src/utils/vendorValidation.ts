

import { z } from 'zod';
import { cloudinaryUrl } from './validation';

// ── Shared primitives ──────────────────────────────────────────────────────────

const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min, `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`);

const optionalTrimmed = (min: number, max: number) =>
  trimmedString(min, max).optional();

export const paginationSchema = z.object({
  page: z
    .preprocess((v) => (v === undefined || v === '' ? 1 : v), z.coerce.number().int().min(1))
    .default(1),
  limit: z
    .preprocess((v) => (v === undefined || v === '' ? 20 : v), z.coerce.number().int().min(1).max(100))
    .default(20),
});

export const narrowPaginationSchema = z.object({
  page: z
    .preprocess((v) => (v === undefined || v === '' ? 1 : v), z.coerce.number().int().min(1))
    .default(1),
  limit: z
    .preprocess((v) => (v === undefined || v === '' ? 20 : v), z.coerce.number().int().min(1).max(50))
    .default(20),
});

const optionalNumberFromQuery = (schema: z.ZodNumber) =>
  z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (Array.isArray(v)) return v[0];
      return v;
    }, schema)
    .optional();

const stringArrayFromBody = (min = 0) =>
  z
    .array(z.string().trim().min(1))
    .min(min)
    .default([]);

// ── Shared param schemas ───────────────────────────────────────────────────────

export const VendorUuidParamSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
});

export const VendorImageParamsSchema = z.object({
  id: z.string().uuid('Invalid package ID'),
  imageId: z.string().uuid('Invalid image ID'),
});

// ── Company (vendor profile) ──────────────────────────────────────────────────

const gstNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{15}$/, 'GST number must be 15 alphanumeric characters')
  .optional();

export const CreateCompanySchema = z
  .object({
    name: trimmedString(2, 120),
    about: optionalTrimmed(10, 2000),
    gst_number: gstNumberSchema,
    logo_url: cloudinaryUrl().optional(),
    cover_url: cloudinaryUrl().optional(),
  })
  .strict();

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;

export const UpdateCompanySchema = z
  .object({
    name: optionalTrimmed(2, 120),
    about: optionalTrimmed(10, 2000),
    gst_number: gstNumberSchema,
    logo_url: cloudinaryUrl().optional(),
    cover_url: cloudinaryUrl().optional(),
  })
  .strict();

export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

export const UploadCompanyDocumentSchema = z
  .object({
    document_type: z.enum(['trade_license', 'gst_certificate', 'pan_card', 'other']),
    url: cloudinaryUrl('Must be a valid Cloudinary URL'),
    public_id: z.string().trim().min(1).max(500),
    label: optionalTrimmed(1, 100),
  })
  .strict();

export type UploadCompanyDocumentInput = z.infer<typeof UploadCompanyDocumentSchema>;

// ── Packages ──────────────────────────────────────────────────────────────────

export const VendorListPackagesQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'pending', 'active', 'rejected']).optional(),
  search: optionalTrimmed(1, 120),
});

export type VendorListPackagesQuery = z.infer<typeof VendorListPackagesQuerySchema>;

export const CreatePackageSchema = z
  .object({
    title: trimmedString(3, 200),
    location_id: z.string().uuid('Invalid location ID'),
    category_id: z.string().uuid('Invalid category ID'),
    trip_type: z.enum(['domestic', 'international']).optional().default('domestic'),
    description: optionalTrimmed(20, 5000),
    highlights: stringArrayFromBody(),
    duration_days: optionalNumberFromQuery(z.coerce.number().int().min(1).max(365)),
    duration_nights: optionalNumberFromQuery(z.coerce.number().int().min(0).max(364)),
    min_group_size: optionalNumberFromQuery(z.coerce.number().int().min(1).max(500)),
    max_group_size: optionalNumberFromQuery(z.coerce.number().int().min(1).max(500)),
    inclusions: stringArrayFromBody(),
    exclusions: stringArrayFromBody(),
    amenities: stringArrayFromBody(),
  })
  .strict();

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageSchema = z
  .object({
    title: optionalTrimmed(3, 200),
    location_id: z.string().uuid('Invalid location ID').optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    trip_type: z.enum(['domestic', 'international']).optional(),
    description: optionalTrimmed(20, 5000),
    highlights: z.array(z.string().trim().min(1)).optional(),
    duration_days: optionalNumberFromQuery(z.coerce.number().int().min(1).max(365)),
    duration_nights: optionalNumberFromQuery(z.coerce.number().int().min(0).max(364)),
    min_group_size: optionalNumberFromQuery(z.coerce.number().int().min(1).max(500)),
    max_group_size: optionalNumberFromQuery(z.coerce.number().int().min(1).max(500)),
    inclusions: z.array(z.string().trim().min(1)).optional(),
    exclusions: z.array(z.string().trim().min(1)).optional(),
    amenities: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

// ── Pricing ───────────────────────────────────────────────────────────────────

const PricingTierSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: trimmedString(1, 100),
    min_people: z.coerce.number().int().min(1),
    max_people: z.coerce.number().int().min(1),
    base_price: z.coerce.number().min(0),
    discounted_price: z.coerce.number().min(0).nullable().optional(),
    currency: z.string().trim().length(3).default('INR'),
    season: z.enum(['all', 'peak', 'off-peak']).default('all'),
    valid_from: z.string().datetime({ offset: true }).nullable().optional(),
    valid_until: z.string().datetime({ offset: true }).nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .strict()
  .refine(
    (t) => t.max_people >= t.min_people,
    { message: 'max_people must be >= min_people', path: ['max_people'] },
  )
  .refine(
    (t) => t.discounted_price === null || t.discounted_price === undefined || t.discounted_price < t.base_price,
    { message: 'discounted_price must be less than base_price', path: ['discounted_price'] },
  );

export const UpsertPricingSchema = z
  .object({
    tiers: z.array(PricingTierSchema).min(1, 'At least one pricing tier is required'),
  })
  .strict();

export type UpsertPricingInput = z.infer<typeof UpsertPricingSchema>;

// ── Itinerary ─────────────────────────────────────────────────────────────────

const ItineraryDaySchema = z
  .object({
    id: z.string().uuid().optional(),
    day_number: z.coerce.number().int().min(1),
    title: trimmedString(2, 200).describe('Day title must be at least 2 characters'),
    description: optionalTrimmed(1, 2000),
    meals: z.array(z.string().trim().min(1)).default([]),
    accommodation: optionalTrimmed(1, 200),
    activities: z.array(z.string().trim().min(1)).default([]),
    transport: optionalTrimmed(1, 200),
  })
  .strict();

export const UpsertItinerarySchema = z
  .object({
    days: z.array(ItineraryDaySchema).min(1, 'At least one itinerary day is required'),
  })
  .strict();

export type UpsertItineraryInput = z.infer<typeof UpsertItinerarySchema>;

// ── Images ────────────────────────────────────────────────────────────────────

export const VendorPackageImageSaveSchema = z
  .object({
    url: z
      .string()
      .url('Must be a valid URL')
      .refine((url) => {
        try {
          const parsed = new URL(url);
          return (
            parsed.protocol === 'https:' &&
            (parsed.hostname === 'res.cloudinary.com' ||
              parsed.hostname.endsWith('.cloudinary.com'))
          );
        } catch {
          return false;
        }
      }, 'Image URL must be served from Cloudinary (https://res.cloudinary.com)'),
    public_id: z.string().trim().min(1).max(500),
    alt_text: optionalTrimmed(1, 200),
    is_cover: z.boolean().default(false),
  })
  .strict();

export type VendorPackageImageSaveInput = z.infer<typeof VendorPackageImageSaveSchema>;

// ── Locations ─────────────────────────────────────────────────────────────────

export const DOMESTIC_REGIONS = [
  'North India', 'South India', 'East India', 'West India', 'Central India',
] as const;

export const INTERNATIONAL_REGIONS = [
  'Southeast Asia', 'East Asia', 'South Asia',
  'Middle East', 'Central Asia',
  'Europe', 'Eastern Europe',
  'Africa', 'North Africa',
  'North America', 'South America', 'Central America',
  'Oceania', 'Arctic / Antarctica',
] as const;

export const ALL_REGIONS = [...DOMESTIC_REGIONS, ...INTERNATIONAL_REGIONS] as const;

export const CreateLocationSchema = z
  .object({
    city: trimmedString(2, 80),
    state: trimmedString(2, 80).optional(),
    region: z.enum(ALL_REGIONS),
    country: trimmedString(2, 80).optional(),
  })
  .strict();

// ── Earnings ──────────────────────────────────────────────────────────────────

export const VendorEarningsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'),
});

export type VendorEarningsQuery = z.infer<typeof VendorEarningsQuerySchema>;

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;

// ── Bookings ──────────────────────────────────────────────────────────────────

export const VendorListBookingsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded', 'failed']).optional(),
  package_id: z.string().uuid().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional(),
});

export type VendorListBookingsQuery = z.infer<typeof VendorListBookingsQuerySchema>;

export const VendorUpdateBookingStatusSchema = z
  .object({
    status: z.enum(['confirmed', 'cancelled', 'completed']),
    note: optionalTrimmed(1, 500),
  })
  .strict();

export type VendorUpdateBookingStatusInput = z.infer<typeof VendorUpdateBookingStatusSchema>;

// ── Payout account ────────────────────────────────────────────────────────────

export const CreatePayoutAccountSchema = z
  .object({
    account_holder_name: trimmedString(2, 120),
    bank_name: optionalTrimmed(2, 120),
    account_number: optionalTrimmed(8, 20),
    ifsc_code: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code').optional(),
    upi_id: optionalTrimmed(5, 100),
    is_primary: z.boolean().default(false),
  })
  .strict()
  .refine(
    (d) => d.upi_id !== undefined || (d.bank_name !== undefined && d.account_number !== undefined && d.ifsc_code !== undefined),
    { message: 'Provide either UPI ID or full bank account details', path: ['upi_id'] },
  );

export type CreatePayoutAccountInput = z.infer<typeof CreatePayoutAccountSchema>;

// ── Notifications ─────────────────────────────────────────────────────────────

export const VendorListNotificationsQuerySchema = paginationSchema.extend({
  is_read: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
});

export type VendorListNotificationsQuery = z.infer<typeof VendorListNotificationsQuerySchema>;
