import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../lib/api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);
    if (resetError) { setError(resetError); return; }
    setSent(true);
  }

  const PanelContent = (
    <div className="auth-split-brand">
      <div className="auth-split-brand-logo">
        <div className="auth-split-brand-logo-mark">T</div>
        <span className="auth-split-brand-name">Toureez</span>
      </div>
      <h2 className="auth-split-brand-title">Reset your<br />password</h2>
      <p className="auth-split-brand-tagline">We'll send you a secure link to get back into your account.</p>
    </div>
  );

  if (sent) {
    return (
      <div className="auth-split">
        {PanelContent}
        <div className="auth-split-form">
          <div className="auth-split-form-inner" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
            <h1 className="auth-form-title">Check your inbox</h1>
            <p className="auth-form-sub" style={{ marginBottom: 28 }}>
              We sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
            </p>
            <Link to="/auth/login" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split">
      {PanelContent}
      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <div style={{ marginBottom: 32 }}>
            <h1 className="auth-form-title">Forgot password?</h1>
            <p className="auth-form-sub">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: 16 }}>
            Remember your password? <Link to="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
