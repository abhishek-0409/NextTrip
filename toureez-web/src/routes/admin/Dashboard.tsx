import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, StatCard, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load dashboard" onRetry={() => query.refetch()} />;

  const m = query.data.data;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and key metrics" />

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Users" value={m.total_users} icon="👤" color="blue" />
        <StatCard label="Total Vendors" value={m.total_vendors} icon="🏢" color="teal" />
        <StatCard label="Total Bookings" value={m.total_bookings} icon="📋" color="green" />
        <StatCard label="Revenue (this month)" value={`₹${Number(m.revenue_this_month).toLocaleString()}`} icon="💰" color="orange" />
      </div>

      <div style={{ marginBottom: 8, fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Pending Actions</div>
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard label="Pending Vendors" value={m.pending_vendors} icon="⏳" color="orange" />
        <StatCard label="Pending Packages" value={m.pending_packages} icon="📦" color="purple" />
        <StatCard label="Pending Reviews" value={m.pending_reviews} icon="⭐" color="teal" />
        <StatCard label="Pending Payouts" value={`₹${Number(m.pending_payouts).toLocaleString()}`} icon="🏦" color="red" />
      </div>

      <div style={{ marginBottom: 8, fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Quick Links</div>
      <div className="vendor-actions-grid">
        {[
          { to: '/admin/vendors', icon: '🏢', label: 'Vendors', sub: 'Approve and manage operators' },
          { to: '/admin/packages', icon: '📦', label: 'Packages', sub: 'Review and approve packages' },
          { to: '/admin/bookings', icon: '📋', label: 'Bookings', sub: 'All platform bookings' },
          { to: '/admin/reviews', icon: '⭐', label: 'Reviews', sub: 'Moderate traveler reviews' },
          { to: '/admin/payouts', icon: '💰', label: 'Payouts', sub: 'Process vendor payouts' },
          { to: '/admin/users', icon: '👤', label: 'Users', sub: 'Manage traveler accounts' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="vendor-action-card">
            <div className="vendor-action-icon">{item.icon}</div>
            <div className="vendor-action-label">{item.label}</div>
            <div className="vendor-action-sub">{item.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
