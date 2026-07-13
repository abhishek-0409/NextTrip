import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { searchPackages, packageCoverImage, packageLocationLabel, packagePrice, packageVendorName, type TripType } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { Config } from '../../constants/config';

const RIBBON_LABELS = ['Best Price', 'Top Rated', 'Local Exclusive'];
const RATING_BUCKETS = [5, 4, 3, 2] as const;
const DURATIONS = ['Any', '0-1 Day', '2-3 Days', '4-7 Days', '7+ Days'] as const;
const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging'] as const;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const rawTripType = params.get('trip_type');
  const [tripType, setTripType] = useState<TripType | ''>(
    rawTripType === 'domestic' || rawTripType === 'international' ? rawTripType : ''
  );
  const [maxPrice, setMaxPrice] = useState(15000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [duration, setDuration] = useState<typeof DURATIONS[number]>('Any');
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number] | null>(null);
  const [sort, setSort] = useState<'best_match' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('best_match');
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['packages', 'search', destination, category, maxPrice, minRating, tripType, sort, page],
    queryFn: () =>
      searchPackages({
        destination: destination || undefined,
        category: category || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating ?? undefined,
        trip_type: tripType || undefined,
        sort,
        page,
        pageSize: Config.packagesPageSize,
      }),
  });

  function applyFilters() {
    setPage(1);
    setParams({ destination, category });
  }

  function clearFilters() {
    setDestination(''); setCategory(''); setTripType('');
    setMaxPrice(15000); setMinRating(null); setDuration('Any'); setDifficulty(null);
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < Config.maxCompareItems ? [...prev, id] : prev
    );
  }

  const items = query.data?.data?.items ?? [];

  return (
    <div className="site-content" style={{ paddingTop: 'var(--nav-h)', paddingBottom: compareIds.length > 0 ? 96 : 64 }}>
      {/* Search bar row */}
      <div style={{ padding: '24px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--heading)', letterSpacing: '-.02em' }}>
          {destination ? `Trips in ${destination}` : 'Explore Packages'}
        </h1>
        <div style={{ display: 'flex', align: 'center', gap: 8 }}>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="search-sort">
            <option value="best_match">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="search-layout">
        {/* Filters sidebar */}
        <aside className="filters-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span className="filters-panel-title" style={{ marginBottom: 0 }}>Filters</span>
            <button
              onClick={clearFilters}
              style={{ fontSize: '.78rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Clear all
            </button>
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Trip Type</div>
            <div className="filter-btn-group">
              {([{ value: '', label: 'All' }, { value: 'domestic', label: '🇮🇳 Domestic' }, { value: 'international', label: '🌍 International' }] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-btn ${tripType === opt.value ? 'active' : ''}`}
                  onClick={() => setTripType(opt.value as TripType | '')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Destination</div>
            <input
              placeholder="City or region"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ fontSize: '.85rem' }}
            />
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {Config.packageCategories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Max Price</div>
            <input type="range" min={500} max={50000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: '100%' }} />
            <div className="filter-range-row"><span>₹500</span><span>₹{maxPrice.toLocaleString()}</span></div>
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Minimum Rating</div>
            {RATING_BUCKETS.map((r) => (
              <div
                key={r}
                className="checkbox-row"
                onClick={() => setMinRating(minRating === r ? null : r)}
                style={{ marginBottom: 8 }}
              >
                <input type="checkbox" readOnly checked={minRating === r} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '.85rem', color: 'var(--body)' }}>{r}.0+ ★</span>
              </div>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Duration</div>
            <div className="filter-btn-group">
              {DURATIONS.map((d) => (
                <button key={d} className={`filter-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>{d}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-label">Difficulty</div>
            <div className="filter-btn-group">
              {DIFFICULTIES.map((d) => (
                <button key={d} className={`filter-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(difficulty === d ? null : d)}>{d}</button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary w-full" onClick={applyFilters} style={{ justifyContent: 'center' }}>
            Apply Filters
          </button>
        </aside>

        {/* Results */}
        <div>
          {!query.isLoading && (
            <div className="search-results-header">
              <span className="search-results-count">
                <strong>{query.data?.data?.total ?? 0}</strong> packages found
              </span>
            </div>
          )}

          {query.isLoading && <LoadingState />}
          {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
          {items.length === 0 && !query.isLoading && (
            <EmptyState
              icon="🔍"
              title="No packages found"
              message="Try adjusting your filters or search for a different destination."
              action={<button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: 8 }}>Clear filters</button>}
            />
          )}

          <div className="results-list">
            {items.map((pkg, i) => {
              const img = packageCoverImage(pkg);
              const price = packagePrice(pkg);
              const isCompared = compareIds.includes(pkg.id);
              return (
                <div className="trip-card" key={pkg.id} style={{ position: 'relative' }}>
                  <Link to={`/app/package/${pkg.id}`} style={{ display: 'block' }}>
                    <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--border)' }}>
                      {img ? (
                        <img src={img} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--primary-light),var(--border))' }} />
                      )}
                      <span className="ribbon">{RIBBON_LABELS[i % RIBBON_LABELS.length]}</span>
                    </div>
                    <div className="trip-card-body">
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {typeof pkg.category === 'string' ? pkg.category : pkg.category?.label ?? pkg.category?.name ?? ''}
                      </div>
                      <div className="trip-card-title">{pkg.title}</div>
                      <div className="trip-card-meta">
                        <span>📍 {packageLocationLabel(pkg)}</span>
                        {pkg.duration_days && <span>· {pkg.duration_days}D</span>}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>By {packageVendorName(pkg)}</div>
                      {pkg.avg_rating !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <span style={{ color: '#F59E0B', fontSize: '.85rem' }}>★</span>
                          <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--heading)' }}>{pkg.avg_rating.toFixed(1)}</span>
                          <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>({pkg.review_count ?? 0})</span>
                        </div>
                      )}
                      <div className="trip-card-price">
                        {price ? <>From <strong>₹{price.toLocaleString()}</strong> /person</> : <span className="muted">Price on request</span>}
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: '0 14px 14px' }}>
                    <button
                      className={`btn btn-sm w-full ${isCompared ? 'btn-primary' : 'btn-outline'}`}
                      style={{ justifyContent: 'center' }}
                      onClick={() => toggleCompare(pkg.id)}
                    >
                      {isCompared ? '✓ Added to Compare' : 'Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {query.data?.data && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32 }}>
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
              <span style={{ fontSize: '.875rem', color: 'var(--muted)' }}>Page {page}</span>
              <button className="btn btn-outline" disabled={!query.data.data.has_more} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {compareIds.length > 0 && (
        <div className="compare-tray">
          <span className="compare-tray-label">Compare ({compareIds.length} selected)</span>
          <Link to={`/app/compare?ids=${compareIds.join(',')}`} className="btn btn-primary btn-sm">
            Compare Now →
          </Link>
          <button
            className="btn btn-sm"
            style={{ color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.3)', border: '1px solid' }}
            onClick={() => setCompareIds([])}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
