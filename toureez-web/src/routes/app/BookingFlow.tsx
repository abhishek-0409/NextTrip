import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getPackageDetail, packagePrice, packagePricingId } from '../../lib/api/packages';
import { createBooking, createRazorpayOrder, verifyRazorpayPayment, type TravelerDetail } from '../../lib/api/bookings';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { LoadingState, ErrorState, StepIndicator } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

const emptyTraveler: TravelerDetail = { name: '', age: 18, gender: 'male', id_type: 'aadhaar', id_number: '', is_primary: false };
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
const STEPS = ['Details', 'Payment', 'Confirmed'];

export default function BookingFlow() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const packageQuery = useQuery({ queryKey: ['package', packageId], queryFn: () => getPackageDetail(packageId!), enabled: !!packageId });
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
  const [travelDate, setTravelDate] = useState(tomorrowStr());
  const [travelers, setTravelers] = useState<TravelerDetail[]>([{ ...emptyTraveler, is_primary: true }]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (packageQuery.isLoading) return <LoadingState />;
  if (packageQuery.isError || !packageQuery.data?.data) return <ErrorState message="Failed to load package" onRetry={() => packageQuery.refetch()} />;

  const pkg = packageQuery.data.data;
  const pricingId = packagePricingId(pkg);
  const pricePerPerson = packagePrice(pkg) ?? 0;
  const total = pricePerPerson * travelers.length;
  const fees = Math.round(total * 0.02);

  function updateTraveler(i: number, field: keyof TravelerDetail, value: string | number | boolean) {
    setTravelers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pricingId) { setError('This package has no active pricing tier and cannot be booked yet.'); return; }
    setSubmitting(true);
    const res = await createBooking({
      package_id: pkg.id, pricing_id: pricingId, travel_date: travelDate,
      num_travelers: travelers.length, traveler_details: travelers, payment_type: paymentType,
      primary_contact: { full_name: contactName, email: contactEmail, phone: contactPhone, city, state },
    });
    setSubmitting(false);
    if (res.error || !res.data) { setError(res.error ?? 'Failed to create booking.'); return; }
    setBookingId(res.data.booking.id);
    setStep(1);
  }

  async function handleRazorpayPayment() {
    if (!bookingId) return;
    setError(null); setSubmitting(true);
    const orderRes = await createRazorpayOrder(bookingId);
    if (orderRes.error || !orderRes.data) { setSubmitting(false); setError(orderRes.error ?? 'Failed to start payment.'); return; }
    const order = orderRes.data;
    try {
      await openRazorpayCheckout({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: 'Toureez', description: pkg.title,
        prefill: { name: contactName, email: contactEmail, contact: contactPhone },
        theme: { color: '#25584B' },
        handler: (response) => {
          void (async () => {
            const v = await verifyRazorpayPayment({ booking_id: bookingId, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            setSubmitting(false);
            if (v.error) { setError(v.error); return; }
            setStep(2);
          })();
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
    } catch { setSubmitting(false); setError('Could not load payment gateway. Check connection and try again.'); }
  }

  return (
    <div className="booking-flow" style={{ paddingTop: 'calc(var(--nav-h) + 32px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}>
          Book: {pkg.title}
        </h1>
        <p className="muted" style={{ fontSize: '.875rem' }}>
          ₹{pricePerPerson.toLocaleString()} per person · {pkg.duration_days ?? '—'} days
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Price summary */}
          <div className="booking-price-summary">
            <div className="booking-price-row"><span>{travelers.length} traveler{travelers.length > 1 ? 's' : ''} × ₹{pricePerPerson.toLocaleString()}</span><span>₹{total.toLocaleString()}</span></div>
            <div className="booking-price-row"><span>Platform fee</span><span>₹{fees.toLocaleString()}</span></div>
            <div className="booking-price-row total"><span>Estimated total</span><span>₹{(total + fees).toLocaleString()}</span></div>
          </div>

          {/* Contact details */}
          <div className="booking-section">
            <div className="booking-section-title">Contact Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Lead traveler name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="booking@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="10-digit Indian mobile" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" required />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} required>
                    <option value="">Select state</option>
                    {Config.indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Travel date</label>
                  <input type="date" min={tomorrowStr()} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment option</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'full' | 'advance')}>
                    <option value="full">Pay in full now</option>
                    <option value="advance">Pay advance (settle later)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Traveler details */}
          <div className="booking-section">
            <div className="booking-section-title">Traveler Details</div>
            {travelers.map((t, i) => (
              <div key={i} className="traveler-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="traveler-card-head">Traveler {i + 1}{t.is_primary ? ' (Primary)' : ''}</div>
                  {travelers.length > 1 && (
                    <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)', padding: '4px 10px' }} onClick={() => setTravelers((p) => p.filter((_, idx) => idx !== i))}>
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input value={t.name} onChange={(e) => updateTraveler(i, 'name', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age</label>
                      <input type="number" min={1} max={120} value={t.age} onChange={(e) => updateTraveler(i, 'age', Number(e.target.value))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select value={t.gender} onChange={(e) => updateTraveler(i, 'gender', e.target.value)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">ID type</label>
                      <select value={t.id_type} onChange={(e) => updateTraveler(i, 'id_type', e.target.value)}>
                        <option value="aadhaar">Aadhaar</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID number</label>
                    <input value={t.id_number} onChange={(e) => updateTraveler(i, 'id_number', e.target.value)} required />
                  </div>
                  <div className="checkbox-row">
                    <input type="checkbox" id={`primary-${i}`} checked={t.is_primary} onChange={() => setTravelers((p) => p.map((tr, idx) => ({ ...tr, is_primary: idx === i })))} />
                    <label htmlFor={`primary-${i}`} style={{ fontSize: '.875rem', fontWeight: 500, cursor: 'pointer' }}>Primary traveler</label>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setTravelers((p) => [...p, { ...emptyTraveler }])}>
              + Add Traveler
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting} style={{ justifyContent: 'center' }}>
            {submitting ? 'Creating booking…' : 'Continue to Payment →'}
          </button>
        </form>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="booking-section">
            <div className="booking-section-title">Order Summary</div>
            <div className="booking-price-summary" style={{ marginBottom: 0 }}>
              <div className="booking-price-row"><span>{travelers.length} traveler{travelers.length > 1 ? 's' : ''} × ₹{pricePerPerson.toLocaleString()}</span><span>₹{total.toLocaleString()}</span></div>
              <div className="booking-price-row"><span>Platform fee</span><span>₹{fees.toLocaleString()}</span></div>
              <div className="booking-price-row total"><span>Total</span><span>₹{(total + fees).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="booking-section" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 16 }}>
              You'll be redirected to Razorpay's secure payment page
            </div>
            {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
            <button
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
              onClick={handleRazorpayPayment}
              style={{ justifyContent: 'center' }}
            >
              {submitting ? 'Processing…' : `🔒 Pay ₹${(total + fees).toLocaleString()} securely`}
            </button>
            <div className="payment-icon-row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <span className="payment-icon">Visa</span>
              <span className="payment-icon">Mastercard</span>
              <span className="payment-icon">UPI</span>
              <span className="payment-icon">NetBanking</span>
            </div>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 12 }}>
              Secured by Razorpay · No card data stored on Toureez
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="confirmed-state">
          <div className="confirmed-icon">🎉</div>
          <div className="confirmed-title">Booking Confirmed!</div>
          <p className="confirmed-msg">
            Your trip to {pkg.title} is booked. Check your email for the confirmation and details.
          </p>
          <div className="confirmed-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/app/bookings/${bookingId}`)}>
              View Booking
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/app')}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
