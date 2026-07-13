import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, PageHeader, StatCard } from '../../components/ui';

export default function Dashboard() {
  const query = useQuery({ queryKey: ['vendor', 'dashboard'], queryFn: vendorApi.dashboard });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load dashboard" onRetry={() => query.refetch()} />;

  const m = query.data.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your packages and bookings"
        actions={<Link className="btn btn-primary" to="/vendor/packages/new">+ New Package</Link>}
      />

      <div className="stat-grid">
        <StatCard label="Total Bookings" value={m.total_bookings} icon="📋" color="blue" />
        <StatCard label="Revenue This Month" value={`₹${Number(m.this_month_revenue).toLocaleString()}`} icon="💰" color="green" />
        <StatCard label="Active Packages" value={m.active_packages} icon="📦" color="orange" />
        <StatCard label="Pending Review" value={m.pending_packages} icon="⏳" color="purple" />
        <StatCard label="Avg Rating" value={m.avg_rating > 0 ? `★ ${m.avg_rating}` : '—'} sub={`${m.total_reviews} reviews`} icon="⭐" color="teal" />
        <StatCard label="Pending Payouts" value={`₹${Number(m.pending_payouts).toLocaleString()}`} icon="🏦" color="red" />
        <StatCard label="Confirmed" value={m.confirmed_bookings} icon="✅" color="green" />
        <StatCard label="Cancelled" value={m.cancelled_bookings} icon="❌" color="red" />
      </div>

      <h2 style={{ fontSize: '.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)', margin: '0 0 12px' }}>
        Quick Actions
      </h2>
      <div className="vendor-actions-grid">
        {[
          { to: '/vendor/packages/new', icon: '📦', label: 'Add New Package', sub: 'Create and list a new travel package' },
          { to: '/vendor/bookings', icon: '📋', label: 'View Bookings', sub: 'Manage your upcoming & past bookings' },
          { to: '/vendor/enquiries', icon: '💬', label: 'Customer Enquiries', sub: 'Respond to traveler questions' },
          { to: '/vendor/analytics', icon: '📈', label: 'Analytics', sub: 'Revenue trends and performance' },
          { to: '/vendor/payouts', icon: '💰', label: 'Payouts', sub: 'Track earnings and payout status' },
          { to: '/vendor/company', icon: '🏢', label: 'Company Profile', sub: 'Update your business details' },
        ].map((action) => (
          <Link key={action.to} to={action.to} className="vendor-action-card">
            <div className="vendor-action-icon">{action.icon}</div>
            <div className="vendor-action-label">{action.label}</div>
            <div className="vendor-action-sub">{action.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
