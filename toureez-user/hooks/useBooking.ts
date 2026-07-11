

import { useMemo } from 'react';
import { Alert } from 'react-native';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import type {
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  createBooking,
  confirmMockPayment,
  getMyBookings,
  getBookingById,
} from '../lib/api/bookings';
import type { CreateBookingResult, ConfirmMockPaymentResult } from '../lib/api/bookings';
import { Config } from '../constants/config';
import type {
  Booking,
  BookingSummary,
  CreateBookingInput,
  PriceCalculation,
} from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────


const GST_RATE = 0.05;


const GROUP_DISCOUNT_RATE = 0.05;


const GROUP_DISCOUNT_THRESHOLD = 7;


const ADVANCE_FRACTION = 0.3;

// ── Query key factory ─────────────────────────────────────────────────────────

export const bookingQueryKeys = {
  all: ['bookings'] as const,
  list: () => ['bookings', 'list'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
} as const;

// ── Price calculation ─────────────────────────────────────────────────────────


export function usePriceCalculation(
  pricingTier: { base_price: number; discounted_price: number | null } | null | undefined,
  numTravelers: number,
  paymentType: 'full' | 'advance'
): PriceCalculation | null {
  return useMemo(() => {
    if (!pricingTier) return null;

    const travelers = Math.max(1, Math.round(numTravelers));
    const basePrice =
      pricingTier.discounted_price ?? pricingTier.base_price;

    const subtotal = basePrice * travelers;

    // 5% group discount for 7+ travelers
    const groupDiscount =
      travelers >= GROUP_DISCOUNT_THRESHOLD
        ? Math.round(subtotal * GROUP_DISCOUNT_RATE)
        : 0;

    const discountedSubtotal = subtotal - groupDiscount;
    const gst = Math.round(discountedSubtotal * GST_RATE);
    const totalAmount = discountedSubtotal + gst;

    const advanceAmount =
      paymentType === 'advance'
        ? Math.round(totalAmount * ADVANCE_FRACTION)
        : totalAmount;

    const balanceAmount =
      paymentType === 'advance' ? totalAmount - advanceAmount : 0;

    return {
      base_price: basePrice,
      num_travelers: travelers,
      subtotal,
      group_discount: groupDiscount,
      gst,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      balance_amount: balanceAmount,
      payment_type: paymentType,
    };
  }, [pricingTier, numTravelers, paymentType]);
}

// ── Create booking ────────────────────────────────────────────────────────────


export function useCreateBooking(): UseMutationResult<
  CreateBookingResult,
  Error,
  CreateBookingInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await createBooking(input);

      if (error || !data) {
        throw new Error(error ?? 'Failed to create booking.');
      }

      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.list(),
      });

      router.replace({
        pathname: '/booking/payment' as never,
        params: { bookingId: data.booking.id },
      });
    },
    onError: (err) => {
      Alert.alert(
        'Booking Failed',
        err.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
}

// ── Confirm mock payment ──────────────────────────────────────────────────────

interface ConfirmMockPaymentInput {
  booking_id: string;
  payment_type: 'full' | 'advance';
}


export function useConfirmMockPayment(): UseMutationResult<
  ConfirmMockPaymentResult,
  Error,
  ConfirmMockPaymentInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmMockPaymentInput) => {
      const { data, error } = await confirmMockPayment(
        input.booking_id,
        input.payment_type,
      );

      if (error || !data) {
        throw new Error(error ?? 'Payment confirmation failed.');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate both list and detail caches
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.detail(data.booking.id),
      });

      // Navigate to confirmation screen
      router.replace({
        pathname: '/booking/confirmation' as never,
        params: { bookingId: data.booking.id },
      });
    },
  });
}

// ── My bookings list ──────────────────────────────────────────────────────────


export function useMyBookings(): UseQueryResult<BookingSummary[], Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: bookingQueryKeys.list(),
    queryFn: async () => {
      const { data, error } = await getMyBookings();
      if (error || !data) throw new Error(error ?? 'Failed to load bookings.');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

// ── Booking detail ────────────────────────────────────────────────────────────


export function useBookingDetail(
  id: string
): UseQueryResult<Booking, Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: bookingQueryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getBookingById(id);
      if (error || !data) throw new Error(error ?? 'Booking not found.');
      return data;
    },
    enabled: isAuthenticated && Boolean(id && id.trim().length > 0),
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: (failureCount, err) => {
      if (
        err.message.includes('not found') ||
        err.message.includes('404')
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
