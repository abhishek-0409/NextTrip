import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Users() {
  const query = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.listUsers() });

  return (
    <div>
      <PageHeader title="Users" subtitle={`${query.data?.data?.length ?? 0} registered travelers`} />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load users" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState icon="👤" title="No users yet" message="Users will appear here as they sign up." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((u) => (
          <Link key={u.id} to={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
            <div className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.95rem', flexShrink: 0 }}>
                  {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>{u.full_name ?? '—'}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{u.email}</div>
                </div>
              </div>
              <span className="badge">{u.role?.replace(/_/g, ' ')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
