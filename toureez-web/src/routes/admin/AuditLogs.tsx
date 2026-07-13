import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function AuditLogs() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'audit-logs', entityType, action],
    queryFn: () => adminApi.listAuditLogs({ entity_type: entityType || undefined, action: action || undefined }),
  });

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Track all admin actions on the platform" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Entity type (e.g. package)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <input
          placeholder="Action (e.g. approved)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        {(entityType || action) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setEntityType(''); setAction(''); }}>Clear</button>
        )}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load audit logs" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="📝" title="No log entries" message="No audit logs match your filters." />
      )}

      {query.data?.data && query.data.data.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {query.data.data.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '.82rem' }}>
                    {new Date(entry.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontSize: '.85rem', fontWeight: 500 }}>{entry.admin_email}</td>
                  <td>
                    <span className="badge" style={{ fontSize: '.72rem' }}>{entry.action}</span>
                  </td>
                  <td style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--heading)' }}>{entry.entity_type}</span> · {entry.entity_id?.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
