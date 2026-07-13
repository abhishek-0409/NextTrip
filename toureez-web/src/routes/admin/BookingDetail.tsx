import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { LoadingState, ErrorState, StatusBadge, PaymentStatusBadge } from '../../components/ui';

const ACTIONS = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'booking', id], queryFn: () => adminApi.getBooking(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateBookingStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;

  const booking = query.data.data;

  return (
    <div style={{ maxWidth: 680 }}>
      <Link to="/admin/bookings" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, textDecoration: 'none' }}>
        ← All Bookings
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading)', margin: 0, flex: 1 }}>{bookingPackageTitle(booking)}</h1>
        <StatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.payment_status} />
      </div>

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
          <div className="bd-field-label">Payment Type</div>
          <div className="bd-field-value">{booking.payment_type === 'full' ? 'Full' : 'Advance'}</div>
        </div>
        <div className="bd-field">
          <div className="bd-field-label">Travelers</div>
          <div className="bd-field-value">{booking.num_travelers ?? '—'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Update Status</div>
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
