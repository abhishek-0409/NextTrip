import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { packagePrice } from '../../lib/api/packages';
import { LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'package', id], queryFn: () => vendorApi.getPackage(id!), enabled: !!id });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [initialized, setInitialized] = useState(false);

  if (query.data?.data && !initialized) {
    setTitle(query.data.data.title);
    setDescription(query.data.data.description ?? '');
    setBasePrice(packagePrice(query.data.data) ?? 0);
    setInitialized(true);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vendor', 'package', id] });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const result = await vendorApi.updatePackage(id!, { title, description });
      await vendorApi.updatePricing(id!, [{ label: 'Standard', min_people: 1, max_people: 20, base_price: basePrice, currency: 'INR' }]);
      return result;
    },
    onSuccess: invalidate,
  });

  const submitMutation = useMutation({ mutationFn: () => vendorApi.submitPackage(id!), onSuccess: invalidate });
  const duplicateMutation = useMutation({ mutationFn: () => vendorApi.duplicatePackage(id!) });
  const deleteMutation = useMutation({ mutationFn: () => vendorApi.deletePackage(id!) });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load package" onRetry={() => query.refetch()} />;

  const pkg = query.data.data;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/vendor/packages" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, textDecoration: 'none' }}>
          ← All Packages
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--heading)', margin: 0, flex: 1 }}>{pkg.title}</h1>
          {pkg.status && <StatusBadge status={pkg.status} />}
        </div>
      </div>

      {/* Edit form */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>General Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Package title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 100 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Base price per person (₹)</label>
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} />
          </div>
          <div>
            <button
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {updateMutation.isSuccess && <span style={{ marginLeft: 12, color: 'var(--success)', fontSize: '.85rem', fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {pkg.status === 'draft' && (
            <button className="btn btn-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              {submitMutation.isPending ? 'Submitting…' : '✓ Submit for Approval'}
            </button>
          )}
          <button className="btn btn-outline" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
            {duplicateMutation.isPending ? 'Duplicating…' : 'Duplicate'}
          </button>
          {pkg.status === 'draft' && (
            <button
              className="btn btn-outline"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
