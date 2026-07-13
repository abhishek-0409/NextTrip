import { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { enquiryPackageTitle } from '../../lib/api/enquiries';
import { LoadingState, ErrorState } from '../../components/ui';

export default function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'enquiry', id], queryFn: () => vendorApi.getEnquiry(id!), enabled: !!id });
  const [message, setMessage] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [query.data]);

  const sendMutation = useMutation({
    mutationFn: () => vendorApi.postEnquiryMessage(id!, message),
    onSuccess: () => { setMessage(''); queryClient.invalidateQueries({ queryKey: ['vendor', 'enquiry', id] }); },
  });

  const resolveMutation = useMutation({
    mutationFn: () => vendorApi.updateEnquiryStatus(id!, 'closed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'enquiry', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load enquiry" onRetry={() => query.refetch()} />;

  const enquiry = query.data.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Link to="/vendor/enquiries" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, textDecoration: 'none' }}>
          ← All Enquiries
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading)', margin: 0 }}>{enquiryPackageTitle(enquiry)}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`enquiry-status-pill ${enquiry.status}`}>{enquiry.status}</span>
            {enquiry.status !== 'closed' && (
              <button className="btn btn-sm btn-outline" onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thread */}
      <div ref={threadRef} className="chat-thread" style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {(!enquiry.messages || enquiry.messages.length === 0) && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem', padding: '40px 0' }}>
            No messages in this enquiry yet.
          </div>
        )}
        {enquiry.messages?.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender_role === 'vendor' ? 'mine' : 'theirs'}`}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', opacity: .7, marginBottom: 3 }}>
              {m.sender_role === 'vendor' ? 'You' : 'Traveler'}
            </div>
            <p style={{ margin: '0 0 4px' }}>{m.message}</p>
            <span style={{ fontSize: '.7rem', opacity: .7 }}>{new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8, flexShrink: 0 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && message && sendMutation.mutate()}
          placeholder="Reply to traveler…"
          disabled={sendMutation.isPending}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary"
          disabled={sendMutation.isPending || !message.trim()}
          onClick={() => sendMutation.mutate()}
          style={{ flexShrink: 0 }}
        >
          {sendMutation.isPending ? 'Sending…' : 'Send ↑'}
        </button>
      </div>
    </div>
  );
}
