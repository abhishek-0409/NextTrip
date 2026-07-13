import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'pending', 'processing', 'paid', 'failed'] as const;

export default function Payouts() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'payouts', status],
    queryFn: () => adminApi.listPayouts(status === 'all' ? undefined : status),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => adminApi.updatePayoutStatus(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  });

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Process vendor earnings and payouts" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load payouts" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="💸" title="No payouts" message={`No ${status === 'all' ? '' : status + ' '}payouts found.`} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((p) => (
          <div key={p.id} className="list-card" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>
                {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="list-card-meta">
              <StatusBadge status={p.status} />
              <span style={{ fontWeight: 800, color: 'var(--heading)', fontSize: '.95rem' }}>₹{Number(p.amount).toLocaleString()}</span>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                onClick={() => statusMutation.mutate({ id: p.id, value: 'paid' })}
                disabled={statusMutation.isPending || p.status === 'paid'}
              >
                Mark Paid
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => statusMutation.mutate({ id: p.id, value: 'failed' })}
                disabled={statusMutation.isPending}
              >
                Mark Failed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
