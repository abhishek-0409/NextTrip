import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Categories() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.listCategories });
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createCategory({ name, label, icon }),
    onSuccess: () => { setName(''); setLabel(''); setIcon(''); invalidate(); },
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => adminApi.deleteCategory(id), onSuccess: invalidate });

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Categories" subtitle="Manage trip categories shown on the platform" />

      {/* Create form */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Add Category</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Slug (e.g. adventure)</label>
            <input placeholder="adventure" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Display label</label>
            <input placeholder="Adventure" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="form-group" style={{ width: 120 }}>
            <label className="form-label">Icon</label>
            <input placeholder="🏔" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            disabled={createMutation.isPending || !name || !label || !icon}
            onClick={() => createMutation.mutate()}
            style={{ marginBottom: 0, alignSelf: 'flex-end' }}
          >
            {createMutation.isPending ? 'Adding…' : '+ Add'}
          </button>
        </div>
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load categories" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="🗂" title="No categories" message="Add your first category above." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((c) => (
          <div key={c.id} className="list-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                {c.icon ?? '📂'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>{c.label ?? c.name}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>slug: {c.name}</div>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(c.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
