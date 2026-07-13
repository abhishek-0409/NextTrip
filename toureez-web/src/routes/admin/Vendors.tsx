import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'pending', 'approved', 'rejected'] as const;

export default function Vendors() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const query = useQuery({
    queryKey: ['admin', 'vendors', status],
    queryFn: () => adminApi.listVendors(status === 'all' ? undefined : status),
  });

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage tour operator accounts" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load vendors" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="🏢" title="No vendors" message={`No ${status === 'all' ? '' : status + ' '}vendors found.`} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((v) => (
          <Link key={v.id} to={`/admin/vendors/${v.id}`} style={{ textDecoration: 'none' }}>
            <div className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  🏢
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.92rem' }}>{v.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{v.owner?.full_name ?? v.owner?.email}</div>
                </div>
              </div>
              <div className="list-card-meta">
                <StatusBadge status={v.status} />
                {v.is_verified && <span className="badge" style={{ background: 'rgba(37,88,75,.1)', color: 'var(--primary)', fontSize: '.7rem' }}>✓ Verified</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
