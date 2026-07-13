import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/ui';
import { Config } from '../../constants/config';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone, city, state })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setUser({ ...user, fullName, phone, city, state });
      setEditing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  const initials = (user?.fullName ?? user?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="site-content" style={{ maxWidth: 640, paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 64 }}>
      <PageHeader title="My Profile" />

      <div className="profile-header">
        <div className="profile-avatar">
          <span className="profile-avatar-initials">{initials}</span>
        </div>
        <div>
          <div className="profile-name">{user?.fullName ?? 'Traveler'}</div>
          <div className="profile-email">{user?.email}</div>
          <span className="profile-role-badge">{user?.role?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Account Info</span>
              <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '.8rem' }} onClick={() => setEditing(true)}>
                ✏ Edit
              </button>
            </div>
            <div className="profile-info-grid" style={{ padding: 16 }}>
              <div className="profile-info-item">
                <div className="profile-info-label">Full Name</div>
                <div className="profile-info-value">{user?.fullName || '—'}</div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-label">Email</div>
                <div className="profile-info-value" style={{ fontSize: '.85rem', wordBreak: 'break-all' }}>{user?.email}</div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-label">Phone</div>
                <div className="profile-info-value">{user?.phone || '—'}</div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-label">Location</div>
                <div className="profile-info-value">
                  {[user?.city, user?.state].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Quick Links</span>
            </div>
            {[
              { to: '/app/bookings', icon: '📋', label: 'My Bookings' },
              { to: '/app/wishlist', icon: '♥', label: 'Wishlist' },
              { to: '/app/enquiries', icon: '💬', label: 'Enquiries' },
              { to: '/app/notifications', icon: '🔔', label: 'Notifications' },
            ].map((item) => (
              <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid var(--border)', color: 'var(--navy)', fontWeight: 600, fontSize: '.9rem' }}>
                <span>{item.icon}</span>{item.label}<span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>›</span>
              </Link>
            ))}
          </div>

          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1rem', margin: '0 0 16px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Edit Profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="booking-form" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
            </label>
            <div className="auth-form-row">
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
                City
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600, color: 'var(--slate)' }}>
                State
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state</option>
                  {Config.indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {saveError && <div className="auth-error">{saveError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-outline" onClick={() => { setEditing(false); setSaveError(null); }}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
