

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { strictLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { VENDOR_ROLE } from '../types';
import {
  getVendorProfile,
  getVendorDashboard,
  getVendorEarningsForMonth,
  getVendorCompany,
  createVendorCompany,
  updateVendorCompany,
  saveCompanyDocument,
  getVendorReviews,
  getVendorPayouts,
  createPayoutAccount,
  getPayoutAccounts,
  getVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  requireCompanyId,
} from '../services/vendorService';
import {
  listVendorPackages,
  getVendorPackage,
  createVendorPackage,
  updateVendorPackage,
  submitVendorPackage,
  deleteVendorPackage,
  duplicateVendorPackage,
  upsertPackagePricing,
  upsertPackageItinerary,
  savePackageImage,
  deletePackageImage,
  setPackageCoverImage,
  listVendorBookings,
  getVendorBooking,
  updateVendorBookingStatus,
} from '../services/vendorPackageService';
import { getVendorAnalytics } from '../services/analyticsService';
import { createLocation } from '../services/locationService';
import {
  getVendorEnquiries,
  getVendorEnquiryDetail,
  addVendorMessage,
  setVendorEnquiryStatus,
} from '../services/enquiryService';
import { success, notFound, validationError } from '../utils/response';
import { AppError } from '../constants/errors';
import {
  VendorUuidParamSchema,
  VendorImageParamsSchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  UploadCompanyDocumentSchema,
  VendorListPackagesQuerySchema,
  CreatePackageSchema,
  UpdatePackageSchema,
  UpsertPricingSchema,
  UpsertItinerarySchema,
  VendorPackageImageSaveSchema,
  VendorListBookingsQuerySchema,
  VendorUpdateBookingStatusSchema,
  CreatePayoutAccountSchema,
  VendorListNotificationsQuerySchema,
  CreateLocationSchema,
  VendorEarningsQuerySchema,
  narrowPaginationSchema,
} from '../utils/vendorValidation';
import { EnquiryMessageSchema } from '../utils/validation';
import { z } from 'zod';

export const vendorRouter = Router();

// All vendor routes require auth + company_owner role
vendorRouter.use(requireAuth, requireRole([VENDOR_ROLE]));
vendorRouter.use(defaultLimiter);

// ── Vendor profile ────────────────────────────────────────────────────────────


vendorRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await getVendorProfile(req.user!.id);
    return success(res, profile);
  } catch (err) {
    return next(err);
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────


vendorRouter.get('/dashboard', async (req, res, next) => {
  try {
    const metrics = await getVendorDashboard(req.user!.id);
    return success(res, metrics);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      return notFound(res, 'Company');
    }
    return next(err);
  }
});


vendorRouter.get('/earnings', async (req, res, next) => {
  try {
    const parsed = VendorEarningsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return validationError(res, parsed.error.issues.map((i) => i.message).join(', '));
    }
    const earnings = await getVendorEarningsForMonth(req.user!.id, parsed.data.month);
    return success(res, earnings);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      return notFound(res, 'Company');
    }
    return next(err);
  }
});

// ── Locations ─────────────────────────────────────────────────────────────────


vendorRouter.post('/locations', async (req, res, next) => {
  try {
    const parsed = CreateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationError(res, parsed.error.issues.map((i) => i.message).join(', '));
    }
    const location = await createLocation(parsed.data);
    return success(res, location, 201);
  } catch (err) {
    return next(err);
  }
});

// ── Company ───────────────────────────────────────────────────────────────────


vendorRouter.get('/company', async (req, res, next) => {
  try {
    const company = await getVendorCompany(req.user!.id);
    return success(res, company);
  } catch (err) {
    return next(err);
  }
});


vendorRouter.post('/company', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreateCompanySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const company = await createVendorCompany(req.user!.id, parsed.data);
    return success(res, company, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.patch('/company', strictLimiter, async (req, res, next) => {
  try {
    const parsed = UpdateCompanySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const company = await updateVendorCompany(req.user!.id, parsed.data);
    return success(res, company);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.post('/company/documents', strictLimiter, async (req, res, next) => {
  try {
    const parsed = UploadCompanyDocumentSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const document = await saveCompanyDocument(req.user!.id, parsed.data);
    return success(res, document, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Packages ──────────────────────────────────────────────────────────────────


vendorRouter.get('/packages', async (req, res, next) => {
  try {
    const parsed = VendorListPackagesQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listVendorPackages(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.post('/packages', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreatePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await createVendorPackage(req.user!.id, parsed.data);
    return success(res, pkg, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.get('/packages/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await getVendorPackage(req.user!.id, id);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.patch('/packages/:id', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpdatePackageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pkg = await updateVendorPackage(req.user!.id, id, parsed.data);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.delete('/packages/:id', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    await deleteVendorPackage(req.user!.id, id);
    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.post('/packages/:id/duplicate', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await duplicateVendorPackage(req.user!.id, id);
    return success(res, pkg, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    return next(err);
  }
});


vendorRouter.get('/analytics', async (req, res, next) => {
  try {
    const companyId = await requireCompanyId(req.user!.id);
    const analytics = await getVendorAnalytics(companyId);
    return success(res, analytics);
  } catch (err) {
    return next(err);
  }
});


vendorRouter.patch('/packages/:id/submit', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const pkg = await submitVendorPackage(req.user!.id, id);
    return success(res, pkg);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 422) {
      return res.status(422).json({ success: false, data: null, error: err.message });
    }
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.patch('/packages/:id/pricing', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpsertPricingSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const pricing = await upsertPackagePricing(req.user!.id, id, parsed.data);
    return success(res, pricing);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.patch('/packages/:id/itinerary', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = UpsertItinerarySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const itinerary = await upsertPackageItinerary(req.user!.id, id, parsed.data);
    return success(res, itinerary);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.post('/packages/:id/images', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorPackageImageSaveSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const image = await savePackageImage(req.user!.id, id, parsed.data);
    return success(res, image, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Package');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.delete('/packages/:id/images/:imageId', strictLimiter, async (req, res, next) => {
  try {
    const { id, imageId } = VendorImageParamsSchema.parse(req.params);
    await deletePackageImage(req.user!.id, id, imageId);
    return success(res, { deleted: true });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Image');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});


vendorRouter.patch('/packages/:id/images/:imageId/cover', strictLimiter, async (req, res, next) => {
  try {
    const { id, imageId } = VendorImageParamsSchema.parse(req.params);
    const image = await setPackageCoverImage(req.user!.id, id, imageId);
    return success(res, image);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Image');
    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(403).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

// ── Bookings ──────────────────────────────────────────────────────────────────


vendorRouter.get('/bookings', async (req, res, next) => {
  try {
    const parsed = VendorListBookingsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await listVendorBookings(req.user!.id, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      status: parsed.data.status,
      paymentStatus: parsed.data.payment_status,
      packageId: parsed.data.package_id,
      fromDate: parsed.data.from_date,
      toDate: parsed.data.to_date,
    });
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.get('/bookings/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const booking = await getVendorBooking(req.user!.id, id);
    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    return next(err);
  }
});


vendorRouter.patch('/bookings/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorUpdateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const booking = await updateVendorBookingStatus(
      req.user!.id,
      id,
      parsed.data.status,
      parsed.data.note,
    );
    return success(res, booking);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Booking');
    if (err instanceof AppError && err.statusCode === 409) {
      return res.status(409).json({ success: false, data: null, error: err.message });
    }
    return next(err);
  }
});

// ── Reviews ───────────────────────────────────────────────────────────────────


vendorRouter.get('/reviews', async (req, res, next) => {
  try {
    const parsed = narrowPaginationSchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorReviews(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Enquiries ─────────────────────────────────────────────────────────────────

const VendorEnquiryStatusSchema = z.object({ status: z.enum(['open', 'closed']) }).strict();


vendorRouter.get('/enquiries', async (req, res, next) => {
  try {
    const enquiries = await getVendorEnquiries(req.user!.id);
    return success(res, enquiries);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.get('/enquiries/:id', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const enquiry = await getVendorEnquiryDetail(req.user!.id, id);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});


vendorRouter.post('/enquiries/:id/messages', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = EnquiryMessageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await addVendorMessage(req.user!.id, id, parsed.data.message);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});


vendorRouter.patch('/enquiries/:id/status', strictLimiter, async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    const parsed = VendorEnquiryStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await setVendorEnquiryStatus(req.user!.id, id, parsed.data.status);
    return success(res, enquiry);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Enquiry');
    return next(err);
  }
});

// ── Payouts ───────────────────────────────────────────────────────────────────


vendorRouter.get('/payouts', async (req, res, next) => {
  try {
    const parsed = narrowPaginationSchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorPayouts(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.get('/payout-accounts', async (req, res, next) => {
  try {
    const accounts = await getPayoutAccounts(req.user!.id);
    return success(res, accounts);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});


vendorRouter.post('/payout-accounts', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreatePayoutAccountSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const account = await createPayoutAccount(req.user!.id, parsed.data);
    return success(res, account, 201);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return notFound(res, 'Company');
    return next(err);
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────


vendorRouter.get('/notifications', async (req, res, next) => {
  try {
    const parsed = VendorListNotificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const result = await getVendorNotifications(req.user!.id, parsed.data);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});


vendorRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = VendorUuidParamSchema.parse(req.params);
    await markNotificationRead(req.user!.id, id);
    return success(res, { marked_read: true });
  } catch (err) {
    return next(err);
  }
});


vendorRouter.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user!.id);
    return success(res, { marked_read: true });
  } catch (err) {
    return next(err);
  }
});
