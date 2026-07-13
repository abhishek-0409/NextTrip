import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { enquiryPackageTitle } from '../../lib/api/enquiries';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Enquiries() {
  const query = useQuery({ queryKey: ['vendor', 'enquiries'], queryFn: vendorApi.listEnquiries });

  return (
    <div>
      <PageHeader title="Enquiries" subtitle="Respond to traveler questions about your packages" />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load enquiries" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && !query.isLoading && (
        <EmptyState icon="💬" title="No enquiries yet" message="When travelers ask questions about your packages, they'll appear here." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {query.data?.data?.map((eq) => (
          <Link key={eq.id} to={`/vendor/enquiries/${eq.id}`} style={{ textDecoration: 'none' }}>
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
