import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { updatePassword } from '../../lib/api/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) { setError(updateError); return; }
    setDone(true);
    setTimeout(() => navigate('/auth/login'), 2000);
  }

  return (
    <div className="auth-split">
      <div className="auth-split-brand">
        <div className="auth-split-brand-inner">
          <div style={{ marginBottom: 40 }}>
            <span className="site-logo-icon" style={{ display: 'inline-flex', marginBottom: 16 }}>T</span>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: 0 }}>
              Set a new password
            </h2>
            <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 12, fontSize: '.95rem', lineHeight: 1.6 }}>
              Choose something strong and memorable.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['🔒 Your data stays encrypted', '✓ Works across all devices', '→ Takes effect immediately'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,.8)', fontSize: '.9rem' }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-split-form">
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--heading)', marginBottom: 8 }}>Password updated!</h1>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>New password</h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', margin: 0 }}>Choose a secure password of at least 6 characters.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '.85rem', color: 'var(--muted)' }}>
                <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Login</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
