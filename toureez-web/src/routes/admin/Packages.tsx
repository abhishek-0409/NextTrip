import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { packageCoverImage, packageVendorName } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const TABS = ['all', 'active', 'pending', 'rejected', 'featured'] as const;

export default function Packages() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const query = useQuery({
    queryKey: ['admin', 'packages', tab],
    queryFn: () => adminApi.listPackages(
      tab === 'featured' ? { isFeatured: true } : tab === 'all' ? undefined : { status: tab }
    ),
  });

  return (
    <div>
      <PageHeader title="Packages" subtitle="Review and manage all travel packages" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="📦" title="No packages" message={`No ${tab === 'all' ? '' : tab + ' '}packages found.`} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {query.data?.data?.map((pkg) => {
          const img = packageCoverImage(pkg);
          return (
            <Link key={pkg.id} to={`/admin/packages/${pkg.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/9', background: 'var(--border)', overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--primary-light),var(--border))' }} />
                  }
                  {pkg.is_featured && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--gold)', color: '#fff', fontSize: '.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: '.04em' }}>
                      FEATURED
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--heading)', lineHeight: 1.35 }}>{pkg.title}</div>
                    {pkg.status && <StatusBadge status={pkg.status} />}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>By {packageVendorName(pkg)}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
