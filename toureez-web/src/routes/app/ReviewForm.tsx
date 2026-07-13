import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitReview } from '../../lib/api/reviews';
import { getBookingDetail, bookingPackageTitle } from '../../lib/api/bookings';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState, StarRating } from '../../components/ui';

const CATEGORIES: { key: 'guide' | 'hotel' | 'food' | 'transport' | 'value'; label: string; emoji: string }[] = [
  { key: 'guide', label: 'Guide', emoji: '🧭' },
  { key: 'hotel', label: 'Accommodation', emoji: '🏨' },
  { key: 'food', label: 'Food', emoji: '🍽️' },
  { key: 'transport', label: 'Transport', emoji: '🚌' },
  { key: 'value', label: 'Value for Money', emoji: '💰' },
];

export default function ReviewForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingDetail(bookingId!),
    enabled: !!bookingId,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ratings, setRatings] = useState<Record<'guide' | 'hotel' | 'food' | 'transport' | 'value', number>>({
    guide: 5, hotel: 5, food: 5, transport: 5, value: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (bookingQuery.isLoading) return <LoadingState />;
  if (bookingQuery.isError || !bookingQuery.data?.data) {
    return <ErrorState message="Failed to load booking" onRetry={() => bookingQuery.refetch()} />;
  }

  const booking = bookingQuery.data.data;
  const overall = Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / CATEGORIES.length);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await submitReview({
      booking_id: booking.id,
      package_id: booking.package_id,
      title,
      body,
      rating_guide: ratings.guide,
      rating_hotel: ratings.hotel,
      rating_food: ratings.food,
      rating_transport: ratings.transport,
      rating_value: ratings.value,
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    navigate('/app/bookings');
  }

  return (
    <div className="site-content" style={{ maxWidth: 600, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px' }}>Write a Review</h1>
        <p className="muted" style={{ margin: 0 }}>{bookingPackageTitle(booking)}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)', marginBottom: 8 }}>
              Overall experience
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy)' }}>{overall}.0</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ fontSize: '1.4rem', color: i < overall ? '#F59E0B' : '#E2E8F0' }}>★</span>
                ))}
              </div>
            </div>
          </div>

          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="rating-category-row">
              <span className="rating-category-name">{cat.emoji} {cat.label}</span>
              <StarRating
                value={ratings[cat.key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
              />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
            Review title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
            Your review
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What made this trip memorable? What could be improved?"
              required
              style={{ minHeight: 120 }}
            />
          </label>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
          {submitting ? 'Submitting…' : '✓ Submit Review'}
        </button>
      </form>
    </div>
  );
}
