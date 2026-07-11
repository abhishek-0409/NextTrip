import { z } from 'zod';

const indianMobileRegex = /^(?:\+91|91)?[6-9]\d{9}$/;


// Extensions that must never be trusted as "vetted media" even if Cloudinary
// served them — SVG/HTML can carry executable script, and Cloudinary's
// unsigned upload preset doesn't stop a client from uploading them with an
// image/* override.
const DANGEROUS_ASSET_EXTENSIONS = /\.(svg|html?|php|exe|js|mjs|jsp|asp|aspx)(\?.*)?$/i;

export const cloudinaryUrl = (message = 'URL must be served from Cloudinary (https://res.cloudinary.com)') =>
  z
    .string()
    .trim()
    .url()
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === 'https:' &&
          (parsed.hostname === 'res.cloudinary.com' || parsed.hostname.endsWith('.cloudinary.com'))
        );
      } catch {
        return false;
      }
    }, message)
    .refine((url) => !DANGEROUS_ASSET_EXTENSIONS.test(url), 'This file type is not allowed');

const optionalTrimmedString = (minLength = 1, maxLength = 255): z.ZodOptional<z.ZodString> =>
  z.string().trim().min(minLength).max(maxLength).optional();

const optionalNumberFromQuery = (schema: z.ZodNumber): z.ZodOptional<z.ZodEffects<z.ZodTypeAny, number, unknown>> =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value[0];
      }

      return value;
    }, schema)
    .optional();

const optionalBooleanFromQuery = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const rawValue = Array.isArray(value) ? value[0] : value;

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return rawValue;
  }, z.boolean())
  .optional();

const amenitiesFromQuery = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }, z.array(z.string().min(1)).min(1))
  .optional();


export const SearchFiltersSchema = z
  .object({
    destination: optionalTrimmedString(1, 120),
    state: optionalTrimmedString(1, 120),
    country: optionalTrimmedString(1, 80),
    trip_type: z.enum(['domestic', 'international']).optional(),
    category: optionalTrimmedString(1, 120),
    min_price: optionalNumberFromQuery(z.coerce.number().min(0)),
    max_price: optionalNumberFromQuery(z.coerce.number().min(0)),
    duration_days: optionalNumberFromQuery(z.coerce.number().int().min(1)),
    min_rating: optionalNumberFromQuery(z.coerce.number().min(0).max(5)),
    amenities: amenitiesFromQuery,
    is_featured: optionalBooleanFromQuery,
    sort: z.enum(['best_match', 'price_asc', 'price_desc', 'rating', 'newest']).optional().default('best_match'),
    page: z
      .preprocess((value) => (value === undefined || value === '' ? 1 : value), z.coerce.number().int().min(1))
      .default(1),
    limit: z
      .preprocess((value) => (value === undefined || value === '' ? 10 : value), z.coerce.number().int().min(1).max(50))
      .default(10),
  })
  .refine(
    (value) =>
      value.min_price === undefined ||
      value.max_price === undefined ||
      value.min_price <= value.max_price,
    {
      message: 'min_price cannot be greater than max_price',
      path: ['min_price'],
    },
  );


export const CompareIdsSchema = z.object({
  ids: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    )
    .pipe(z.array(z.string().uuid()).min(2).max(4)),
});


export const UpdateProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().regex(indianMobileRegex, 'Invalid Indian mobile number').optional(),
    city: z.string().trim().min(1).max(120).optional(),
    state: z.string().trim().min(1).max(120).optional(),
    avatar_url: cloudinaryUrl().optional(),
  })
  .strict();


export const ToggleWishlistSchema = z
  .object({
    package_id: z.string().uuid(),
  })
  .strict();


export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});


export const LocationsQuerySchema = z.object({
  popular: optionalBooleanFromQuery,
});


export const ImageParamsSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
});


export const PackageImageSaveSchema = z
  .object({
    url: z
      .string()
      .url('url must be a valid URL')
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
    alt_text: z.string().trim().max(200).optional(),
    is_cover: z.boolean().optional().default(false),
  })
  .strict();

export type PackageImageSaveInput = z.infer<typeof PackageImageSaveSchema>;


export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;


export const CreateEnquirySchema = z
  .object({
    package_id: z.string().uuid(),
    message: z.string().trim().min(1).max(2000),
  })
  .strict();


export const EnquiryMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
  })
  .strict();


export const ChatRequestSchema = z
  .object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(2000),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().trim().min(1).max(2000),
        }),
      )
      .max(20)
      .optional(),
  })
  .strict();
