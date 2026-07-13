import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

const TABS = ['all', 'published', 'unpublished', 'verified'] as const;

export default function Reviews() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'reviews', tab],
    queryFn: () => adminApi.listReviews(
      tab === 'published' ? { is_published: true }
      : tab === 'unpublished' ? { is_published: false }
      : tab === 'verified' ? { is_verified: true }
      : undefined
    ),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
  const publishMutation = useMutation({ mutationFn: (id: string) => adminApi.publishReview(id), onSuccess: invalidate });
  const unpublishMutation = useMutation({ mutationFn: (id: string) => adminApi.unpublishReview(id), onSuccess: invalidate });
  const verifyMutation = useMutation({ mutationFn: (id: string) => adminApi.verifyReview(id), onSuccess: invalidate });

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate traveler reviews across all packages" />

      <div className="tab-row" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load reviews" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="⭐" title="No reviews" message={`No ${tab === 'all' ? '' : tab + ' '}reviews found.`} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {query.data?.data?.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-card-header">
              <div className="review-card-avatar">{(r.user.display_name ?? 'T').charAt(0).toUpperCase()}</div>
              <div className="review-card-meta">
                <div className="review-card-name">{r.user.display_name ?? 'Traveler'}</div>
                <div className="review-card-date">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  {' · '}
                  {r.is_published ? <span style={{ color: 'var(--success)' }}>Published</span> : <span style={{ color: 'var(--muted)' }}>Pending</span>}
                  {r.is_verified && <span style={{ color: 'var(--primary)' }}> · Verified</span>}
                </div>
              </div>
              <div className="review-card-rating">{'★'.repeat(Math.round(r.overall_rating))}</div>
            </div>
            {r.title && <div className="review-card-title">{r.title}</div>}
            {r.body && <p className="review-card-body">{r.body}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => publishMutation.mutate(r.id)}>Publish</button>
              <button className="btn btn-sm btn-outline" onClick={() => unpublishMutation.mutate(r.id)}>Unpublish</button>
              <button className="btn btn-sm btn-outline" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => verifyMutation.mutate(r.id)}>✓ Verify</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
