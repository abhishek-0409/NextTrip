import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { cancelBooking, getBookingDetail, getBookingInvoiceUrl, bookingPackageTitle, createBalancePaymentOrder, verifyBalancePayment } from '../../lib/api/bookings';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { LoadingState, ErrorState, StatusBadge, PaymentStatusBadge } from '../../components/ui';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [payingBalance, setPayingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ['booking', id], queryFn: () => getBookingDetail(id!), enabled: !!id });
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
    setBalanceError(null); setPayingBalance(true);
    const orderRes = await createBalancePaymentOrder(id);
    if (orderRes.error || !orderRes.data) { setPayingBalance(false); setBalanceError(orderRes.error ?? 'Failed to start balance payment.'); return; }
    const order = orderRes.data;
    try {
      await openRazorpayCheckout({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: 'Toureez', description: 'Balance payment', theme: { color: '#25584B' },
        handler: (response) => {
          void (async () => {
            const v = await verifyBalancePayment(id, { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            setPayingBalance(false);
            if (v.error) { setBalanceError(v.error); return; }
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
          })();
        },
        modal: { ondismiss: () => setPayingBalance(false) },
      });
    } catch { setPayingBalance(false); setBalanceError('Could not load payment gateway.'); }
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;

  const booking = query.data.data;

  return (
    <div className="site-content" style={{ maxWidth: 760, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <Link to="/app/bookings" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: 20 }}>
        ← All Bookings
      </Link>

      <div className="bd-header">
        <h1 className="bd-title">{bookingPackageTitle(booking)}</h1>
        <div className="bd-badges">
          <StatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>
      </div>

      <div className="bd-grid">
        <div className="bd-field">
          <div className="bd-field-label">Travel Date</div>
          <div className="bd-field-value">
            {new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="bd-field">
          <div className="bd-field-label">Total Amount</div>
          <div className="bd-field-value">₹{Number(booking.total_amount).toLocaleString()}</div>
        </div>
        {booking.payment_status === 'partial' && (
          <div className="bd-field">
            <div className="bd-field-label">Balance Due</div>
            <div className="bd-field-value" style={{ color: 'var(--warning)' }}>₹{Number(booking.balance_amount ?? 0).toLocaleString()}</div>
          </div>
        )}
        <div className="bd-field">
          <div className="bd-field-label">Booked On</div>
          <div className="bd-field-value">
            {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {balanceError && <div className="auth-error" style={{ marginBottom: 16 }}>{balanceError}</div>}

      <div className="bd-actions">
        <button className="btn btn-outline" onClick={handleInvoice}>📄 Download Invoice</button>
        {booking.payment_status === 'partial' && (
          <button className="btn btn-primary" disabled={payingBalance} onClick={handlePayBalance}>
            {payingBalance ? 'Processing…' : `💳 Pay Balance ₹${Number(booking.balance_amount ?? 0).toLocaleString()}`}
          </button>
        )}
        {booking.status === 'completed' && (
          <Link className="btn btn-primary" to={`/app/review/${booking.id}`}>✍ Write a Review</Link>
        )}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <button
            className="btn btn-outline"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        )}
      </div>
    </div>
  );
}
