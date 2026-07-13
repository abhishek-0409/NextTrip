import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Notifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'notifications'], queryFn: vendorApi.listNotifications });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => vendorApi.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => vendorApi.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] }),
  });

  const unreadCount = query.data?.data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        actions={unreadCount > 0 ? <button className="btn btn-outline btn-sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>Mark all read</button> : undefined}
      />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load notifications" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="🔔" title="All caught up" message="No notifications right now." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
            style={{
              display: 'flex',
              gap: 14,
              padding: '16px 20px',
              borderRadius: 'var(--radius)',
              background: n.is_read ? 'var(--surface)' : 'var(--primary-light)',
              border: `1px solid ${n.is_read ? 'var(--border-light)' : 'rgba(37,88,75,.15)'}`,
              cursor: n.is_read ? 'default' : 'pointer',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? 500 : 700, color: 'var(--heading)', fontSize: '.9rem', marginBottom: 2 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{n.body}</div>}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}>
              {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
