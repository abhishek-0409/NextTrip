import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../lib/api/wishlist';
import { packageCoverImage, packageLocationLabel, packagePrice } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['wishlist'], queryFn: getWishlist });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromWishlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return (
    <div className="site-content" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <PageHeader
        title="Wishlist"
        subtitle={query.data?.data?.length ? `${query.data.data.length} saved trip${query.data.data.length === 1 ? '' : 's'}` : undefined}
      />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load wishlist" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && (
        <EmptyState
          message="Your wishlist is empty. Save trips you love and find them here."
          action={<Link className="btn btn-primary" to="/app/search">Browse packages</Link>}
        />
      )}

      <div className="wishlist-grid">
        {query.data?.data?.map((pkg) => {
          const cover = packageCoverImage(pkg);
          const price = packagePrice(pkg);
          return (
            <div key={pkg.id} className="wishlist-card">
              <Link to={`/app/package/${pkg.id}`}>
                <div className="wishlist-card-img">
                  {cover ? (
                    <img src={cover} alt={pkg.title} />
                  ) : (
                    <div className="wishlist-card-img-placeholder" />
                  )}
                </div>
                <div className="wishlist-card-body">
                  <div className="wishlist-card-title">{pkg.title}</div>
                  <div className="wishlist-card-location">
                    📍 {packageLocationLabel(pkg) || 'Location TBD'}
                  </div>
                  {pkg.duration_days && (
                    <div className="muted" style={{ fontSize: '.78rem', marginTop: 4 }}>
                      {pkg.duration_days} days
                    </div>
                  )}
                </div>
              </Link>
              <div className="wishlist-card-footer">
                {price ? (
                  <span className="wishlist-card-price">₹{price.toLocaleString()}<span className="muted" style={{ fontWeight: 400, fontSize: '.75rem' }}>/person</span></span>
                ) : (
                  <span className="muted" style={{ fontSize: '.8rem' }}>Price on request</span>
                )}
                <button
                  className="btn btn-outline"
                  style={{ padding: '5px 12px', fontSize: '.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => removeMutation.mutate(pkg.id)}
                  disabled={removeMutation.isPending}
                >
                  ♥ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
