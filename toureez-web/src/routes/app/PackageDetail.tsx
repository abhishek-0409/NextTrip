import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPackageDetail, getSimilarPackages, packageCoverImage, packageLocationLabel, packagePrice, packageVendorName } from '../../lib/api/packages';
import { getPackageReviews } from '../../lib/api/reviews';
import { toggleWishlist } from '../../lib/api/wishlist';
import { LoadingState, ErrorState } from '../../components/ui';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const [travelers, setTravelers] = useState(2);
  const [activeImg, setActiveImg] = useState(0);

  const packageQuery = useQuery({ queryKey: ['package', id], queryFn: () => getPackageDetail(id!), enabled: !!id });
  const reviewsQuery = useQuery({ queryKey: ['package', id, 'reviews'], queryFn: () => getPackageReviews(id!), enabled: !!id });
  const similarQuery = useQuery({ queryKey: ['package', id, 'similar'], queryFn: () => getSimilarPackages(id!), enabled: !!id });

  if (packageQuery.isLoading) return <LoadingState />;
  if (packageQuery.isError || !packageQuery.data?.data) return <ErrorState message="Failed to load package" onRetry={() => packageQuery.refetch()} />;

  const pkg = packageQuery.data.data;
  const cover = packageCoverImage(pkg);
  const basePrice = packagePrice(pkg) ?? 0;
  const fees = Math.round(basePrice * 0.02);
  const total = basePrice * travelers + fees;
  const reviews = reviewsQuery.data?.data ?? [];
  const categoryLabel = typeof pkg.category === 'string' ? pkg.category : pkg.category?.label ?? pkg.category?.name ?? 'Experience';
  const vendorName = packageVendorName(pkg);
  const location = packageLocationLabel(pkg);

  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.overall_rating) === star).length;
    return { star, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  const images = [cover, cover, cover, cover].filter(Boolean) as string[];

  return (
    <div className="site-content" style={{ paddingTop: 'calc(var(--nav-h) + 24px)', paddingBottom: 80 }}>
      <div className="pd-breadcrumb">
        <Link to="/app">Home</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <Link to="/app/search">{categoryLabel}</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <span style={{ color: 'var(--heading)' }}>{pkg.title}</span>
      </div>

      {/* Gallery */}
      <div className="pd-gallery">
        <div className="pd-gallery-main">
          {images[activeImg] ? (
            <img src={images[activeImg]} alt={pkg.title} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--primary-light),var(--border))' }} />
          )}
        </div>
        {images.length > 1 && (
          <div className="pd-gallery-thumbs">
            {images.map((img, i) => (
              <div
                key={i}
                className="pd-gallery-thumb"
                onClick={() => setActiveImg(i)}
                style={{ outline: i === activeImg ? `2px solid var(--primary)` : undefined, outlineOffset: 2 }}
              >
                <img src={img} alt="" />
                {i === images.length - 1 && images.length > 4 && (
                  <span className="pd-gallery-more">+{images.length - 4} more</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pd-layout">
        {/* Left column */}
        <div>
          {categoryLabel && <div className="pd-cat-tag">{categoryLabel}</div>}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <h1 className="pd-title" style={{ margin: 0 }}>{pkg.title}</h1>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => void toggleWishlist(pkg.id)}
              style={{ flexShrink: 0 }}
            >
              ♥ Save
            </button>
          </div>

          <div className="pd-vendor-row">
            <div className="pd-vendor-avatar">{vendorName.slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="pd-vendor-name" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{vendorName}</span>
                {pkg.company?.is_verified && (
                  <span className="trust-badge trust-badge-tooltip">
                    ✓ Verified Operator
                    <span className="trust-badge-tip">Reviewed by Toureez · GST registered · Trade licence verified</span>
                  </span>
                )}
              </div>
              {pkg.avg_rating !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ color: '#F59E0B', fontSize: '.9rem' }}>{'★'.repeat(Math.round(pkg.avg_rating ?? 0))}</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{pkg.avg_rating.toFixed(1)} · {pkg.review_count ?? 0} reviews</span>
                </div>
              )}
            </div>
          </div>

          <div className="pd-meta-pills">
            {pkg.duration_days && <span className="pd-meta-pill">⏱ <strong>{pkg.duration_days}</strong> Days</span>}
            {(pkg.min_group_size || pkg.max_group_size) && (
              <span className="pd-meta-pill">👥 <strong>{pkg.min_group_size ?? 1}–{pkg.max_group_size ?? 12}</strong> people</span>
            )}
            {location && <span className="pd-meta-pill">📍 <strong>{location}</strong></span>}
            {pkg.difficulty && <span className="pd-meta-pill">⛰ <strong>{pkg.difficulty}</strong></span>}
          </div>

          {pkg.description && (
            <>
              <div className="pd-section-title">About this trip</div>
              <p className="pd-desc">{pkg.description}</p>
            </>
          )}

          {pkg.highlights && pkg.highlights.length > 0 && (
            <>
              <div className="pd-section-title">Highlights</div>
              <div className="pd-icon-list">
                {pkg.highlights.map((h) => (
                  <div className="pd-icon-item" key={h}>
                    <span className="pd-icon-item-icon">✨</span>
                    <span className="pd-icon-item-text">{h}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <>
              <div className="pd-section-title">What's included</div>
              <div className="pd-icon-list">
                {pkg.inclusions.map((inc) => (
                  <div className="pd-icon-item" key={inc}>
                    <span className="pd-icon-item-icon">✅</span>
                    <span className="pd-icon-item-text">{inc}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {pkg.exclusions && pkg.exclusions.length > 0 && (
            <>
              <div className="pd-section-title">Not included</div>
              <div className="pd-icon-list">
                {pkg.exclusions.map((exc) => (
                  <div className="pd-icon-item excl" key={exc}>
                    <span className="pd-icon-item-icon">✕</span>
                    <span className="pd-icon-item-text">{exc}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Reviews */}
          <div className="pd-section-title">Reviews</div>
          {reviews.length > 0 ? (
            <>
              <div className="reviews-summary">
                <div className="reviews-overall-score">
                  <div className="reviews-overall-number">{pkg.avg_rating?.toFixed(1) ?? '—'}</div>
                  <div className="reviews-overall-stars">{'★'.repeat(Math.round(pkg.avg_rating ?? 0))}</div>
                  <div className="reviews-overall-count">{pkg.review_count ?? reviews.length} reviews</div>
                </div>
                <div className="reviews-bars">
                  {ratingBuckets.map((b) => (
                    <div key={b.star} className="reviews-bar-row">
                      <span style={{ width: 16, flexShrink: 0 }}>{b.star}</span>
                      <div className="reviews-bar-track"><div className="reviews-bar-fill" style={{ width: `${b.pct}%` }} /></div>
                      <span style={{ width: 30, textAlign: 'right' }}>{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              {reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-card-header">
                    <div className="review-card-avatar">{r.user.display_name.charAt(0).toUpperCase()}</div>
                    <div className="review-card-meta">
                      <div className="review-card-name">{r.user.display_name}</div>
                      <div className="review-card-date">{new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="review-card-rating">{'★'.repeat(Math.round(r.overall_rating))}</div>
                  </div>
                  {r.title && <div className="review-card-title">{r.title}</div>}
                  {r.body && <p className="review-card-body">{r.body}</p>}
                </div>
              ))}
            </>
          ) : (
            <p className="muted" style={{ padding: '20px 0' }}>No reviews yet — be the first to review this trip.</p>
          )}

          {/* Similar packages */}
          {similarQuery.data?.data && similarQuery.data.data.length > 0 && (
            <>
              <div className="pd-section-title">Similar Experiences</div>
              <div className="pkg-grid">
                {similarQuery.data.data.slice(0, 3).map((sp) => {
                  const spImg = packageCoverImage(sp);
                  const spPrice = packagePrice(sp);
                  return (
                    <Link key={sp.id} to={`/app/package/${sp.id}`} className="pkg-card">
                      <div className="pkg-card-img">
                        {spImg ? <img src={spImg} alt={sp.title} /> : <div style={{ width: '100%', height: '100%', background: 'var(--primary-light)' }} />}
                      </div>
                      <div className="pkg-card-body">
                        <div className="pkg-card-title">{sp.title}</div>
                        <div className="pkg-card-footer">
                          <div>
                            <div className="pkg-card-price">₹{spPrice?.toLocaleString() ?? '—'}</div>
                            <div className="pkg-card-price-sub">per person</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sticky booking card */}
        <aside className="booking-card">
          <div className="booking-card-price">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span className="booking-card-amount">₹{basePrice.toLocaleString()}</span>
              <sub style={{ fontSize: '.9rem', color: 'var(--muted)', fontWeight: 400 }}>/ person</sub>
            </div>
            {pkg.avg_rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <span style={{ color: '#F59E0B', fontSize: '.9rem' }}>★</span>
                <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--heading)' }}>{pkg.avg_rating.toFixed(1)}</span>
                <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>({pkg.review_count ?? 0} reviews)</span>
              </div>
            )}
          </div>

          <div className="booking-card-form">
            <div className="booking-card-field">
              <label>Departure date</label>
              <input type="date" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="booking-card-field">
              <label>Travelers</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px' }}>
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--heading)' }}
                >
                  −
                </button>
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, color: 'var(--heading)' }}>{travelers}</span>
                <button
                  type="button"
                  onClick={() => setTravelers((t) => t + 1)}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--heading)' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="booking-card-breakdown">
            <div className="booking-card-breakdown-row">
              <span>₹{basePrice.toLocaleString()} × {travelers} people</span>
              <span>₹{(basePrice * travelers).toLocaleString()}</span>
            </div>
            <div className="booking-card-breakdown-row">
              <span>Platform fee</span>
              <span>₹{fees.toLocaleString()}</span>
            </div>
            <div className="booking-card-breakdown-row">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <Link className="btn btn-primary w-full" to={`/app/booking/${pkg.id}`} style={{ justifyContent: 'center', marginBottom: 10 }}>
            Book Now
          </Link>
          <Link className="btn btn-outline w-full" to={`/app/enquiries?package=${pkg.id}`} style={{ justifyContent: 'center' }}>
            Ask a question
          </Link>

          <div className="booking-card-trust">
            <div className="booking-card-trust-item">✓ Secure payment via Razorpay</div>
            <div className="booking-card-trust-item">✓ Verified vendor</div>
            <div className="booking-card-trust-item">✓ Instant confirmation</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
