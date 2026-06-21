-- Adds 'partial' to the payment_status enum so advance/partial payments can
-- be represented honestly instead of being collapsed into 'paid'.
--
-- Root cause of the bug this supports: verifyRazorpayPayment previously set
-- status='confirmed' and payment_status='paid' for ALL bookings after a
-- successful Razorpay charge, even when payment_type='advance' (i.e. only
-- the advance/partial amount was actually paid). Vendors and admins saw
-- "Confirmed" / "Paid" on bookings that still had an outstanding balance.
--
-- This migration only adds the enum value — the application code change
-- (toureez-backend/src/services/razorpayService.ts) makes verifyRazorpayPayment
-- set payment_status='partial' (and leave booking status='pending') when
-- payment_type='advance', and only mark status='confirmed'/payment_status='paid'
-- once the full amount is in (either a 'full' payment_type, or after the
-- balance is settled via verifyBalancePayment).

alter type public.payment_status add value if not exists 'partial';
