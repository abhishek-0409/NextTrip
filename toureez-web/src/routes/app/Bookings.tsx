import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listBookings, bookingPackageTitle } from '../../lib/api/bookings';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PaymentStatusBadge, PageHeader } from '../../components/ui';

const TABS = ['all', 'upcoming', 'completed', 'cancelled'] as const;

export default function Bookings() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const query = useQuery({
    queryKey: ['bookings', tab],
    queryFn: () => listBookings(tab === 'all' ? undefined : tab),
  });

  return (
    <div className="site-content" style={{ maxWidth: 800, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <PageHeader title="My Bookings" subtitle="View and manage all your trip bookings" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load bookings" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState
          icon="🧳"
          title="No bookings yet"
          message="Ready for your next adventure? Browse handpicked packages and book your perfect trip."
          action={<Link className="btn btn-primary btn-sm" to="/app/search" style={{ marginTop: 12 }}>Browse packages</Link>}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((b) => (
          <Link key={b.id} to={`/app/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
            <div className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  🧳
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.92rem' }}>{bookingPackageTitle(b)}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 2 }}>
                    📅 {new Date(b.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
