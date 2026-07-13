import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { LoadingState, ErrorState, StatusBadge, PaymentStatusBadge } from '../../components/ui';

const ACTIONS = ['confirmed', 'cancelled', 'completed'] as const;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'booking', id], queryFn: () => vendorApi.getBooking(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: string) => vendorApi.updateBookingStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'booking', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;

  const booking = query.data.data;

  return (
    <div style={{ maxWidth: 700 }}>
      <Link to="/vendor/bookings" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, textDecoration: 'none' }}>
        ← All Bookings
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading)', margin: 0, flex: 1 }}>{bookingPackageTitle(booking)}</h1>
        <StatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.payment_status} />
      </div>

      {/* Key details */}
      <div className="bd-grid" style={{ marginBottom: 16 }}>
        <div className="bd-field">
          <div className="bd-field-label">Travel Date</div>
          <div className="bd-field-value">{booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
        </div>
        <div className="bd-field">
          <div className="bd-field-label">Total Amount</div>
          <div className="bd-field-value">₹{Number(booking.total_amount).toLocaleString()}</div>
        </div>
        <div className="bd-field">
          <div className="bd-field-label">Travelers</div>
          <div className="bd-field-value">{booking.num_travelers ?? '—'} person{(booking.num_travelers ?? 0) > 1 ? 's' : ''}</div>
        </div>
        <div className="bd-field">
          <div className="bd-field-label">Payment</div>
          <div className="bd-field-value">{booking.payment_type === 'full' ? 'Full payment' : 'Advance paid'}</div>
        </div>
      </div>

      {/* Traveler info */}
      {booking.user && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 12 }}>Traveler Contact</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
              {(booking.user.full_name ?? booking.user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--heading)' }}>{booking.user.full_name ?? '—'}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{booking.user.email}</div>
              {booking.user.phone && <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{booking.user.phone}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Payment info */}
      {booking.payment && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 12 }}>Payment Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--muted)' }}>Amount paid</span>
              <span style={{ fontWeight: 700, color: 'var(--heading)' }}>₹{Number(booking.payment.amount_paid ?? 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--muted)' }}>Method</span>
              <span style={{ fontWeight: 500, color: 'var(--heading)' }}>{booking.payment.payment_method ?? '—'}</span>
            </div>
            {booking.payment.paid_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
                <span style={{ color: 'var(--muted)' }}>Paid on</span>
                <span style={{ fontWeight: 500, color: 'var(--heading)' }}>{new Date(booking.payment.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status actions */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 12 }}>Update Status</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ACTIONS.map((a) => (
            <button
              key={a}
              className={`btn btn-sm ${booking.status === a ? 'btn-primary' : 'btn-outline'}`}
              disabled={statusMutation.isPending || booking.status === a}
              onClick={() => statusMutation.mutate(a)}
            >
              {booking.status === a ? '✓ ' : ''}{a[0].toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
