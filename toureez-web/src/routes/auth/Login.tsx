import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

const ROLE_HOME: Record<UserRole, string> = {
  traveler: '/app',
  company_owner: '/vendor',
  admin: '/admin',
};

const FEATURES = [
  { icon: '🛡️', text: 'Verified operators only' },
  { icon: '💳', text: 'Secure Razorpay payments' },
  { icon: '📋', text: 'Instant booking confirmation' },
  { icon: '🗺️', text: '500+ curated destinations' },
];

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data: user, error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError || !user) { setError(signInError ?? 'Login failed.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    setSession(user, session);
    const redirect = params.get('redirect');
    navigate(redirect ? decodeURIComponent(redirect) : ROLE_HOME[user.role]);
  }

  return (
    <div className="auth-split">
      <div className="auth-split-brand">
        <div className="auth-split-brand-logo">
          <div className="auth-split-brand-logo-mark">T</div>
          <span className="auth-split-brand-name">Toureez</span>
        </div>
        <h2 className="auth-split-brand-title">Your next adventure<br />awaits you</h2>
        <p className="auth-split-brand-tagline">
          Discover handpicked trips across India and beyond. Every experience, curated for the traveler in you.
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
          <div style={{ marginBottom: 32 }}>
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">Sign in to your Toureez account</p>
          </div>

          <button type="button" className="google-btn" onClick={() => void signInWithGoogle()}>
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <div className="auth-divider" style={{ margin: '20px 0' }}>or continue with email</div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
              <div style={{ textAlign: 'right' }}>
                <Link to="/auth/forgot-password" style={{ fontSize: '.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to={`/auth/signup${params.get('redirect') ? `?redirect=${params.get('redirect')}` : ''}`}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
