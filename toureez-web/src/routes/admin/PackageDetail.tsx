import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { packagePrice, packageVendorName } from '../../lib/api/packages';
import { LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'package', id], queryFn: () => adminApi.getPackage(id!), enabled: !!id });
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'package', id] });
  const approveMutation = useMutation({ mutationFn: () => adminApi.approvePackage(id!), onSuccess: invalidate });
  const rejectMutation = useMutation({ mutationFn: () => adminApi.rejectPackage(id!, rejectReason), onSuccess: invalidate });
  const featureMutation = useMutation({ mutationFn: (v: boolean) => adminApi.featurePackage(id!, v), onSuccess: invalidate });
  const bestsellerMutation = useMutation({ mutationFn: (v: boolean) => adminApi.bestsellerPackage(id!, v), onSuccess: invalidate });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load package" onRetry={() => query.refetch()} />;

  const pkg = query.data.data;

  return (
    <div style={{ maxWidth: 700 }}>
      <Link to="/admin/packages" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, textDecoration: 'none' }}>
        ← All Packages
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading)', margin: 0, flex: 1 }}>{pkg.title}</h1>
        {pkg.status && <StatusBadge status={pkg.status} />}
        {pkg.is_featured && <span className="badge" style={{ background: 'rgba(200,154,53,.15)', color: 'var(--gold)' }}>★ Featured</span>}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Package Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Vendor', value: packageVendorName(pkg) },
            { label: 'Price', value: packagePrice(pkg) != null ? `₹${packagePrice(pkg)!.toLocaleString()} / person` : 'Not set' },
            ...(pkg.duration_days ? [{ label: 'Duration', value: `${pkg.duration_days} days` }] : []),
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{row.label}</span>
              <span style={{ color: 'var(--heading)', fontSize: '.85rem', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
          {pkg.description && <p style={{ color: 'var(--body)', fontSize: '.875rem', lineHeight: 1.6, marginTop: 8 }}>{pkg.description}</p>}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Moderation</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
            {approveMutation.isPending ? 'Approving…' : '✓ Approve'}
          </button>
          <button className="btn btn-outline" disabled={featureMutation.isPending} onClick={() => featureMutation.mutate(!pkg.is_featured)}>
            {pkg.is_featured ? 'Unfeature' : '★ Feature'}
          </button>
          <button className="btn btn-outline" disabled={bestsellerMutation.isPending} onClick={() => bestsellerMutation.mutate(true)}>
            🏆 Bestseller
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Reject Package</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Rejection reason</label>
            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain the issue so the vendor can fix it" />
          </div>
          <button
            className="btn btn-outline"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={rejectMutation.isPending || !rejectReason}
            onClick={() => rejectMutation.mutate()}
          >
            {rejectMutation.isPending ? 'Rejecting…' : 'Reject Package'}
          </button>
        </div>
      </div>
    </div>
  );
}
