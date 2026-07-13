import { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getEnquiryDetail, postEnquiryMessage, enquiryPackageTitle } from '../../lib/api/enquiries';
import { LoadingState, ErrorState } from '../../components/ui';

export default function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['enquiry', id], queryFn: () => getEnquiryDetail(id!), enabled: !!id });
  const [message, setMessage] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [query.data]);

  const sendMutation = useMutation({
    mutationFn: () => postEnquiryMessage(id!, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load enquiry" onRetry={() => query.refetch()} />;

  const enquiry = query.data.data;

  return (
    <div className="site-content" style={{ paddingTop: 'calc(var(--nav-h) + 24px)', paddingBottom: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-h))' }}>
      {/* Header */}
      <div style={{ paddingBottom: 16, marginBottom: 0, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Link to="/app/enquiries" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, textDecoration: 'none' }}>
          ← All Enquiries
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading)', margin: 0 }}>{enquiryPackageTitle(enquiry)}</h1>
          <span className={`enquiry-status-pill ${enquiry.status}`}>{enquiry.status}</span>
        </div>
      </div>

      {/* Thread */}
      <div ref={threadRef} className="chat-thread" style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        {(!enquiry.messages || enquiry.messages.length === 0) && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem', padding: '40px 0' }}>
            No messages yet. Start the conversation below.
          </div>
        )}
        {enquiry.messages?.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender_role === 'user' ? 'mine' : 'theirs'}`}>
            <p style={{ margin: '0 0 4px' }}>{m.message}</p>
            <span style={{ fontSize: '.7rem', color: 'var(--muted)', opacity: .8 }}>{new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, paddingBottom: 24, flexShrink: 0 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && message && sendMutation.mutate()}
          placeholder="Type your message…"
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
