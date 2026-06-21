import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  cancelBooking,
  getBookingDetail,
  getBookingInvoiceUrl,
  bookingPackageTitle,
  createBalancePaymentOrder,
  verifyBalancePayment,
} from '../../lib/api/bookings';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { Card, LoadingState, ErrorState, StatusBadge, PaymentStatusBadge } from '../../components/ui';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [payingBalance, setPayingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingDetail(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', id] }),
  });

  async function handleInvoice() {
    const res = await getBookingInvoiceUrl(id!);
    if (res.data?.url) window.open(res.data.url, '_blank');
  }

  async function handlePayBalance() {
    if (!id) return;
    setBalanceError(null);
    setPayingBalance(true);

    const orderRes = await createBalancePaymentOrder(id);
    if (orderRes.error || !orderRes.data) {
      setPayingBalance(false);
      setBalanceError(orderRes.error ?? 'Failed to start balance payment.');
      return;
    }

    const order = orderRes.data;

    try {
      await openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Toureez',
        description: 'Balance payment',
        theme: { color: '#E8631A' },
        handler: (response) => {
          void (async () => {
            const verifyRes = await verifyBalancePayment(id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPayingBalance(false);
            if (verifyRes.error) {
              setBalanceError(verifyRes.error);
              return;
            }
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
          })();
        },
        modal: { ondismiss: () => setPayingBalance(false) },
      });
    } catch {
      setPayingBalance(false);
      setBalanceError('Could not load the payment gateway. Check your connection and try again.');
    }
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) {
    return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;
  }

  const booking = query.data.data;

  return (
    <div className="site-content">
      <h1>{bookingPackageTitle(booking)}</h1>
      <StatusBadge status={booking.status} />
      <PaymentStatusBadge status={booking.payment_status} />

      <Card className="detail-section">
        <p>Travel date: {booking.travel_date}</p>
        <p>Total amount: ₹{booking.total_amount}</p>
        {booking.payment_status === 'partial' && (
          <p className="muted">Balance due: ₹{booking.balance_amount ?? 0}</p>
        )}
        <p>Booked on: {new Date(booking.created_at).toLocaleDateString()}</p>
      </Card>

      {balanceError && <div className="auth-error">{balanceError}</div>}

      <div className="detail-actions">
        <button className="btn btn-outline" onClick={handleInvoice}>Download Invoice</button>
        {booking.payment_status === 'partial' && (
          <button className="btn btn-primary" disabled={payingBalance} onClick={handlePayBalance}>
            {payingBalance ? 'Processing…' : `Pay Balance (₹${booking.balance_amount ?? 0})`}
          </button>
        )}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <button className="btn btn-outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        )}
        {booking.status === 'completed' && (
          <Link className="btn btn-primary" to={`/app/review/${booking.id}`}>Write a Review</Link>
        )}
      </div>
    </div>
  );
}
