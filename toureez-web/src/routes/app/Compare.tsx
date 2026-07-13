import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getPackagesForCompare, packageLocationLabel, packagePrice, packageCoverImage } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { Config } from '../../constants/config';

const ROWS = [
  { key: 'price', label: 'Price / person' },
  { key: 'duration', label: 'Duration' },
  { key: 'rating', label: 'Rating' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'location', label: 'Location' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'group', label: 'Group Size' },
] as const;

export default function Compare() {
  const [params] = useSearchParams();
  const prefillIds = params.get('ids')?.split(',').filter(Boolean) ?? [];
  const [ids, setIds] = useState<string[]>(prefillIds);
  const [inputId, setInputId] = useState('');

  const query = useQuery({
    queryKey: ['packages', 'compare', ids],
    queryFn: () => getPackagesForCompare(ids),
    enabled: ids.length > 0,
  });

  function addId() {
    if (inputId && ids.length < Config.maxCompareItems && !ids.includes(inputId)) {
      setIds((prev) => [...prev, inputId]);
      setInputId('');
    }
  }

  const pkgs = query.data?.data ?? [];

  return (
    <div className="site-content" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}>Compare Packages</h1>
        <p style={{ color: 'var(--muted)', fontSize: '.875rem', margin: 0 }}>Add up to {Config.maxCompareItems} packages to compare side-by-side</p>
      </div>

      {/* Add package input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32, maxWidth: 480 }}>
        <input
          placeholder="Paste a Package ID to add"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addId()}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={addId}
          disabled={ids.length >= Config.maxCompareItems || !inputId.trim()}
        >
          Add
        </button>
      </div>

      {ids.length === 0 && (
        <EmptyState
          icon="⚖"
          title="No packages to compare"
          message="Add packages from the search results using the Compare button, or paste a Package ID above."
          action={<Link to="/app/search" className="btn btn-primary" style={{ marginTop: 8 }}>Browse packages</Link>}
        />
      )}

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}

      {pkgs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}></th>
                {pkgs.map((p) => {
                  const img = packageCoverImage(p);
                  return (
                    <th key={p.id} style={{ verticalAlign: 'top', padding: '16px 20px' }}>
                      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3', marginBottom: 12, background: 'var(--border)' }}>
                        {img ? <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--primary-light)' }} />}
                      </div>
                      <Link to={`/app/package/${p.id}`} style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--heading)', display: 'block', marginBottom: 8 }}>{p.title}</Link>
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', width: '100%', justifyContent: 'center' }}
                        onClick={() => setIds((prev) => prev.filter((i) => i !== p.id))}
                      >
                        Remove
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>{row.label}</td>
                  {pkgs.map((p) => {
                    let val = '';
                    if (row.key === 'price') val = packagePrice(p) ? `₹${packagePrice(p)!.toLocaleString()}` : 'On request';
                    if (row.key === 'duration') val = p.duration_days ? `${p.duration_days} days` : '—';
                    if (row.key === 'rating') val = p.avg_rating != null ? `★ ${p.avg_rating.toFixed(1)}` : '—';
                    if (row.key === 'reviews') val = p.review_count != null ? `${p.review_count} reviews` : '—';
                    if (row.key === 'location') val = packageLocationLabel(p) || '—';
                    if (row.key === 'difficulty') val = p.difficulty || '—';
                    if (row.key === 'group') val = (p.min_group_size || p.max_group_size) ? `${p.min_group_size ?? 1}–${p.max_group_size ?? '∞'} pax` : '—';
                    return <td key={p.id} style={{ fontWeight: 500, color: 'var(--heading)', fontSize: '.9rem' }}>{val}</td>;
                  })}
                </tr>
              ))}
              <tr>
                <td></td>
                {pkgs.map((p) => (
                  <td key={p.id} style={{ paddingTop: 16 }}>
                    <Link to={`/app/booking/${p.id}`} className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>Book Now</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
