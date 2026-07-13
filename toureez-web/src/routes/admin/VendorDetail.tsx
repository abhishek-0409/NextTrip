import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'vendor', id], queryFn: () => adminApi.getVendor(id!), enabled: !!id });
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'vendor', id] });
  const approveMutation = useMutation({ mutationFn: () => adminApi.approveVendor(id!), onSuccess: invalidate });
  const rejectMutation = useMutation({ mutationFn: () => adminApi.rejectVendor(id!, rejectReason), onSuccess: invalidate });
  const verifyMutation = useMutation({ mutationFn: () => adminApi.verifyVendor(id!), onSuccess: invalidate });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load vendor" onRetry={() => query.refetch()} />;

  const vendor = query.data.data;

  return (
    <div style={{ maxWidth: 680 }}>
      <Link to="/admin/vendors" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, textDecoration: 'none' }}>
        ← All Vendors
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading)', margin: 0, flex: 1 }}>{vendor.name}</h1>
        <StatusBadge status={vendor.status} />
        {vendor.is_verified && <span className="badge" style={{ background: 'rgba(37,88,75,.1)', color: 'var(--primary)' }}>✓ Verified</span>}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Company Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Owner', value: vendor.owner?.full_name ?? '—' },
            { label: 'Email', value: vendor.owner?.email ?? '—' },
            ...(vendor.owner?.phone ? [{ label: 'Phone', value: vendor.owner.phone }] : []),
            { label: 'Rating', value: vendor.avg_rating ? `★ ${vendor.avg_rating} (${vendor.total_reviews} reviews)` : '—' },
            { label: 'Packages', value: String(vendor.total_packages ?? 0) },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{row.label}</span>
              <span style={{ color: 'var(--heading)', fontSize: '.85rem', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
          {vendor.about && <p style={{ color: 'var(--body)', fontSize: '.875rem', lineHeight: 1.6, marginTop: 8 }}>{vendor.about}</p>}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
            {approveMutation.isPending ? 'Approving…' : '✓ Approve'}
          </button>
          <button className="btn btn-outline" disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
            {verifyMutation.isPending ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 14 }}>Reject Vendor</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Rejection reason</label>
            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this vendor is being rejected" />
          </div>
          <button
            className="btn btn-outline"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={rejectMutation.isPending || !rejectReason}
            onClick={() => rejectMutation.mutate()}
          >
            {rejectMutation.isPending ? 'Rejecting…' : 'Reject Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
