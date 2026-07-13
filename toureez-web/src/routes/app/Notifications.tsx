import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/api/notifications';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui';

export default function Notifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications() });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = query.data?.data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="site-content" style={{ maxWidth: 640, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 4px' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            Mark all read
          </button>
        )}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load notifications" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && (
        <EmptyState icon="🔔" title="All caught up" message="No notifications right now." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              transition: 'background .15s',
              marginBottom: 8,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? 500 : 700, color: 'var(--heading)', fontSize: '.9rem', marginBottom: 2 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>{n.body}</div>}
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
