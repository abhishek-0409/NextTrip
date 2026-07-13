

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { chatLimiter } from '../middleware/rateLimiter';
import { getChatReply } from '../services/chatService';
import { getBookingById } from '../services/bookingService';
import { getPackageById } from '../services/packageService';
import { success, validationError } from '../utils/response';
import { ChatRequestSchema } from '../utils/validation';

export const chatRouter = Router();

chatRouter.use(optionalAuth);

async function buildTripContext(userId: string | undefined, bookingId: string | undefined): Promise<string | undefined> {
  if (userId === undefined || bookingId === undefined) return undefined;

  try {
    const booking = await getBookingById(userId, bookingId);
    if (booking.package === undefined) return undefined;

    const itinerary = await getPackageById(booking.package_id).catch(() => null);
    const dayTitles = (itinerary?.itineraries ?? [])
      .sort((a, b) => a.day_number - b.day_number)
      .map((day) => `Day ${day.day_number}: ${day.title}`)
      .join('; ');

    return [
      `Package: ${booking.package.title}`,
      `Destination: ${booking.package.location.city}, ${booking.package.location.state}`,
      `Travel date: ${booking.travel_date}`,
      `Duration: ${booking.package.duration_days} days / ${booking.package.duration_nights} nights`,
      `Booking status: ${booking.status}`,
      dayTitles !== '' ? `Itinerary: ${dayTitles}` : undefined,
    ]
      .filter((line): line is string => line !== undefined)
      .join('\n');
  } catch {
    // Booking not found, doesn't belong to this user, or any other lookup
    // failure — fall back to context-free chat rather than erroring the request.
    return undefined;
  }
}

chatRouter.post('/', chatLimiter, async (req, res, next) => {
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const { message, history, booking_id: bookingId } = parsed.data;
    const tripContext = await buildTripContext(req.user?.id, bookingId);
    const reply = await getChatReply(message, history ?? [], tripContext);

    return success(res, { reply });
  } catch (err) {
    return next(err);
  }
});
