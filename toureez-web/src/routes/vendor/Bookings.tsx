import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PaymentStatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'confirmed', 'pending', 'cancelled', 'completed'] as const;

export default function Bookings() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const query = useQuery({
    queryKey: ['vendor', 'bookings', status],
    queryFn: () => vendorApi.listBookings(status === 'all' ? undefined : status),
  });

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Track and manage traveler bookings" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load bookings" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="📋" title="No bookings" message={`No ${status === 'all' ? '' : status + ' '}bookings found.`} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((b) => (
          <Link key={b.id} to={`/vendor/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
            <div className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  📋
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.92rem' }}>{bookingPackageTitle(b)}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 2 }}>
                    Travel: {b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    {b.num_travelers && ` · ${b.num_travelers} traveler${b.num_travelers > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
              <div className="list-card-meta">
                <StatusBadge status={b.status} />
                <PaymentStatusBadge status={b.payment_status} />
                <span style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>₹{Number(b.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
