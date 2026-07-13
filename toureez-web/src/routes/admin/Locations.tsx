import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

const REGIONS = ['North India', 'South India', 'East India', 'West India', 'Central India'] as const;

export default function Locations() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'locations'], queryFn: adminApi.listLocations });
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [region, setRegion] = useState<typeof REGIONS[number]>('North India');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createLocation({ city, state, region }),
    onSuccess: () => { setCity(''); setState(''); invalidate(); },
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => adminApi.deleteLocation(id), onSuccess: invalidate });
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => adminApi.updateLocation(id, { is_popular: value }),
    onSuccess: invalidate,
  });

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Locations" subtitle="Manage destinations shown across the platform" />

      {/* Create form */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Add Location</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
            <label className="form-label">City</label>
            <input placeholder="e.g. Manali" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
            <label className="form-label">State</label>
            <input placeholder="e.g. Himachal Pradesh" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as typeof REGIONS[number])}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary"
            disabled={createMutation.isPending || !city || !state || !region}
            onClick={() => createMutation.mutate()}
            style={{ alignSelf: 'flex-end' }}
          >
            {createMutation.isPending ? 'Adding…' : '+ Add'}
          </button>
        </div>
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load locations" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="📍" title="No locations" message="Add your first destination above." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((l) => (
          <div key={l.id} className="list-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                📍
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>{l.city}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{l.state} · {l.region}</div>
              </div>
              {l.is_popular && <span className="badge" style={{ background: 'rgba(200,154,53,.12)', color: 'var(--gold)', fontSize: '.68rem' }}>★ Popular</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => toggleFeaturedMutation.mutate({ id: l.id, value: !l.is_popular })}
                disabled={toggleFeaturedMutation.isPending}
              >
                {l.is_popular ? 'Unfeature' : '★ Feature'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(l.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
