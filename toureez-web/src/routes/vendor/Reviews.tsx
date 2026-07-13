import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Reviews() {
  const query = useQuery({ queryKey: ['vendor', 'reviews'], queryFn: vendorApi.listReviews });

  const avg = query.data?.data?.length
    ? (query.data.data.reduce((s, r) => s + r.overall_rating, 0) / query.data.data.length).toFixed(1)
    : null;

  return (
    <div>
      <PageHeader title="Reviews" subtitle={avg ? `★ ${avg} average · ${query.data?.data?.length} reviews` : undefined} />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load reviews" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="⭐" title="No reviews yet" message="Reviews from travelers will appear here after completed trips." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {query.data?.data?.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-card-header">
              <div className="review-card-avatar">{(r.user.display_name ?? 'T').charAt(0).toUpperCase()}</div>
              <div className="review-card-meta">
                <div className="review-card-name">{r.user.display_name ?? 'Traveler'}</div>
                <div className="review-card-date">{new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="review-card-rating">{'★'.repeat(Math.round(r.overall_rating))}</div>
            </div>
            {r.title && <div className="review-card-title">{r.title}</div>}
            {r.body && <p className="review-card-body">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
