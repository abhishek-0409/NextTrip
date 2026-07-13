import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { packageCoverImage, packagePrice } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'active', 'pending', 'draft', 'rejected'] as const;

export default function Packages() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['vendor', 'packages', status],
    queryFn: () => vendorApi.listPackages(status === 'all' ? undefined : status),
  });

  const filtered = query.data?.data?.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Packages"
        subtitle={`${query.data?.data?.length ?? 0} total packages`}
        actions={<Link className="btn btn-primary" to="/vendor/packages/new">+ New Package</Link>}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
      {filtered && filtered.length === 0 && !query.isLoading && (
        <EmptyState
          icon="📦"
          title="No packages found"
          message={status === 'all' ? 'Create your first package to start attracting travelers.' : `No ${status} packages.`}
          action={<Link className="btn btn-primary" to="/vendor/packages/new">+ New Package</Link>}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {filtered?.map((pkg) => {
          const img = packageCoverImage(pkg);
          const price = packagePrice(pkg);
          return (
            <Link key={pkg.id} to={`/vendor/packages/${pkg.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ overflow: 'hidden', transition: 'box-shadow .15s' }}>
                <div style={{ aspectRatio: '16/9', background: 'var(--border)', overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--primary-light),var(--border))' }} />
                  }
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--heading)', lineHeight: 1.35 }}>{pkg.title}</div>
                    {pkg.status && <StatusBadge status={pkg.status} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {price != null
                      ? <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--primary)' }}>₹{price.toLocaleString()}</span>
                      : <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>No pricing</span>
                    }
                    {pkg.duration_days && (
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{pkg.duration_days} days</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
