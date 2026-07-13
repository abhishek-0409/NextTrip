import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { createEnquiry, listEnquiries, enquiryPackageTitle } from '../../lib/api/enquiries';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Enquiries() {
  const [params] = useSearchParams();
  const prefillPackage = params.get('package') ?? '';
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['enquiries'], queryFn: listEnquiries });

  const [packageId, setPackageId] = useState(prefillPackage);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(!!prefillPackage);

  const createMutation = useMutation({
    mutationFn: () => createEnquiry(packageId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setMessage('');
      setShowForm(false);
    },
  });

  return (
    <div className="site-content" style={{ maxWidth: 720, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <PageHeader
        title="Enquiries"
        subtitle="Ask operators about any package before you book"
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '✕ Cancel' : '+ New Enquiry'}
          </button>
        }
      />

      {showForm && (
        <Card className="detail-section" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', margin: '0 0 14px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            New Enquiry
          </h2>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
            Package ID
            <input value={packageId} onChange={(e) => setPackageId(e.target.value)} placeholder="Paste the package ID from the package page" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
            Your message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about dates, group size, inclusions, custom itineraries…"
              style={{ minHeight: 100 }}
            />
          </label>
          <button
            className="btn btn-primary"
            disabled={createMutation.isPending || !packageId || !message}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Sending…' : '✉ Send Enquiry'}
          </button>
        </Card>
      )}

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load enquiries" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && (
        <EmptyState message="No enquiries yet. Ask an operator about any package to get started." />
      )}

      <div>
        {query.data?.data?.map((eq) => (
          <Link key={eq.id} to={`/app/enquiries/${eq.id}`} style={{ textDecoration: 'none' }}>
            <div className="enquiry-card">
              <div className="enquiry-icon">💬</div>
              <div className="enquiry-body">
                <div className="enquiry-title">{enquiryPackageTitle(eq)}</div>
                {eq.last_message_preview && (
                  <div className="enquiry-preview">{eq.last_message_preview}</div>
                )}
              </div>
              <span className={`enquiry-status-pill ${eq.status}`}>{eq.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
