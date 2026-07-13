import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState } from '../../components/ui';

const ROLES = ['traveler', 'company_owner', 'admin'] as const;

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => adminApi.getUser(id!), enabled: !!id });

  const roleMutation = useMutation({
    mutationFn: (role: string) => adminApi.updateUserRole(id!, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load user" onRetry={() => query.refetch()} />;

  const user = query.data.data;

  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/admin/users" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, textDecoration: 'none' }}>
        ← All Users
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
          {(user.full_name ?? user.email ?? '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 4px' }}>{user.full_name ?? '—'}</h1>
          <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{user.email}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Account Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Email', value: user.email },
            { label: 'Joined', value: new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Role', value: <strong style={{ textTransform: 'capitalize' }}>{user.role?.replace(/_/g, ' ')}</strong> },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{row.label}</span>
              <span style={{ color: 'var(--heading)', fontSize: '.85rem' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Change Role</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${user.role === r ? 'btn-primary' : 'btn-outline'}`}
              disabled={roleMutation.isPending || r === user.role}
              onClick={() => roleMutation.mutate(r)}
            >
              {user.role === r ? '✓ ' : ''}{r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
