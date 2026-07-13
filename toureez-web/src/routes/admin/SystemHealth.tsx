import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { LoadingState, ErrorState, PageHeader } from '../../components/ui';

interface HealthStatus {
  status: string;
  database?: string;
  uptime_seconds?: number;
  [key: string]: unknown;
}

export default function SystemHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthStatus>('/health'),
    refetchInterval: 30_000,
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load system health" onRetry={() => query.refetch()} />;

  const health = query.data.data;
  const isHealthy = health.status === 'ok' || health.status === 'healthy';

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader
        title="System Health"
        subtitle="Auto-refreshes every 30 seconds"
        actions={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', fontWeight: 600, color: isHealthy ? 'var(--success)' : 'var(--danger)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isHealthy ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
            {isHealthy ? 'All systems operational' : 'Issues detected'}
          </span>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ '--stat-color': isHealthy ? 'var(--success)' : 'var(--danger)' } as React.CSSProperties}>
          <div className="stat-card-icon">{isHealthy ? '✅' : '⚠️'}</div>
          <div className="stat-card-body">
            <div className="stat-card-label">Status</div>
            <div className="stat-card-value" style={{ textTransform: 'capitalize' }}>{health.status}</div>
          </div>
        </div>
        {health.database && (
          <div className="stat-card" style={{ '--stat-color': 'var(--primary)' } as React.CSSProperties}>
            <div className="stat-card-icon">🗄️</div>
            <div className="stat-card-body">
              <div className="stat-card-label">Database</div>
              <div className="stat-card-value" style={{ textTransform: 'capitalize' }}>{health.database}</div>
            </div>
          </div>
        )}
        {health.uptime_seconds !== undefined && (
          <div className="stat-card" style={{ '--stat-color': 'var(--primary)' } as React.CSSProperties}>
            <div className="stat-card-icon">⏱️</div>
            <div className="stat-card-body">
              <div className="stat-card-label">Uptime</div>
              <div className="stat-card-value">{Math.round(health.uptime_seconds / 60)}m</div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 12 }}>Raw Response</div>
        <pre style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: '.8rem', color: 'var(--body)', lineHeight: 1.6, overflowX: 'auto', margin: 0 }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  );
}
