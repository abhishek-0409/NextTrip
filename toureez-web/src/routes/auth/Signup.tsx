import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

const FEATURES = [
  { icon: '🆓', text: 'Free to join, no hidden fees' },
  { icon: '♥', text: 'Save trips to your wishlist' },
  { icon: '⚖', text: 'Compare packages side by side' },
  { icon: '📲', text: 'Manage bookings on the go' },
];

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { data: user, error: signUpError } = await signUp(email, password, fullName, phone, city, state);
    setLoading(false);
    if (signUpError || !user) { setError(signUpError ?? 'Sign up failed.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    setSession(user, session);
    const redirect = params.get('redirect');
    navigate(redirect ? decodeURIComponent(redirect) : '/app');
  }

  return (
    <div className="auth-split">
      <div className="auth-split-brand">
        <div className="auth-split-brand-logo">
          <div className="auth-split-brand-logo-mark">T</div>
          <span className="auth-split-brand-name">Toureez</span>
        </div>
        <h2 className="auth-split-brand-title">Join thousands of<br />happy travelers</h2>
        <p className="auth-split-brand-tagline">
          Create your free account and unlock access to handpicked trips, exclusive deals, and a community of explorers.
        </p>
        <div className="auth-split-brand-features">
          {FEATURES.map((f) => (
            <div key={f.text} className="auth-split-brand-feature">
              <div className="auth-split-brand-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <div style={{ marginBottom: 28 }}>
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-sub">It's free and takes less than a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">
                Phone <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.8rem' }}>(optional)</span>
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" autoComplete="tel" />
            </div>
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" autoComplete="address-level2" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state</option>
                  {Config.indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 chars" required minLength={6} autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat" required autoComplete="new-password" />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: 20 }}>
            Already have an account?{' '}
            <Link to={`/auth/login${params.get('redirect') ? `?redirect=${params.get('redirect')}` : ''}`}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
