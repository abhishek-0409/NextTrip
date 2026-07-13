import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, PageHeader } from '../../components/ui';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analytics() {
  const [month, setMonth] = useState(currentMonth());
  const query = useQuery({ queryKey: ['vendor', 'earnings', month], queryFn: () => vendorApi.earnings(month) });

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Revenue and booking performance"
        actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--heading)', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '.9rem', cursor: 'pointer' }} />}
      />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load analytics" onRetry={() => query.refetch()} />}

      {query.data?.data && (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card" style={{ '--stat-color': 'var(--primary)' } as React.CSSProperties}>
              <div className="stat-card-icon">💰</div>
              <div className="stat-card-body">
                <div className="stat-card-label">Revenue ({query.data.data.month})</div>
                <div className="stat-card-value">₹{Number(query.data.data.revenue).toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--stat-color': 'var(--success)' } as React.CSSProperties}>
              <div className="stat-card-icon">📋</div>
              <div className="stat-card-body">
                <div className="stat-card-label">Confirmed Bookings</div>
                <div className="stat-card-value">{query.data.data.bookings}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Summary for {query.data.data.month}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Total Revenue</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{Number(query.data.data.revenue).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Confirmed/Completed Bookings</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--heading)' }}>{query.data.data.bookings}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
