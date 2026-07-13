import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { getCategories } from '../../lib/api/categories';
import { getLocations } from '../../lib/api/locations';
import { LoadingState, ErrorState } from '../../components/ui';

export default function PackageNew() {
  const navigate = useNavigate();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const locationsQuery = useQuery({ queryKey: ['locations', 'all'], queryFn: () => getLocations(false) });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [basePrice, setBasePrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (categoriesQuery.isLoading || locationsQuery.isLoading) return <LoadingState />;
  if (categoriesQuery.isError || locationsQuery.isError) {
    return <ErrorState message="Failed to load categories/locations" onRetry={() => { categoriesQuery.refetch(); locationsQuery.refetch(); }} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (description.trim().length < 20) { setError('Description must be at least 20 characters.'); return; }
    if (!categoryId || !locationId) { setError('Please select a category and location.'); return; }
    setSubmitting(true);
    const res = await vendorApi.createPackage({ title, description, category_id: categoryId, location_id: locationId, duration_days: durationDays });
    if (res.error || !res.data) { setSubmitting(false); setError(res.error ?? 'Failed to create package.'); return; }
    await vendorApi.updatePricing(res.data.id, [
      { label: 'Standard', min_people: 1, max_people: 20, base_price: basePrice, currency: 'INR' },
    ]);
    setSubmitting(false);
    navigate(`/vendor/packages/${res.data.id}`);
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/vendor/packages" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, textDecoration: 'none' }}>
          ← All Packages
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--heading)', margin: 0 }}>New Package</h1>
        <p style={{ color: 'var(--muted)', fontSize: '.875rem', marginTop: 4 }}>Fill in the details below — you can edit everything after creation.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Package Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Package title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spiti Valley Adventure — 7 Days" required minLength={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(min 20 characters)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what makes this trip special — itinerary, highlights, experience level…"
                required
                style={{ minHeight: 120 }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select category</option>
                  {categoriesQuery.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.label ?? c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
                  <option value="">Select location</option>
                  {locationsQuery.data?.data?.map((l) => <option key={l.id} value={l.id}>{l.city}{l.state ? `, ${l.state}` : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Pricing & Duration</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (days)</label>
              <input type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Base price per person (₹)</label>
              <input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Package →'}
          </button>
          <Link to="/vendor/packages" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
