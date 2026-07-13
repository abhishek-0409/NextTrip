import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/vendors', label: 'Vendors', icon: '🏢' },
  { to: '/admin/packages', label: 'Packages', icon: '📦' },
  { to: '/admin/bookings', label: 'Bookings', icon: '📋' },
  { to: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { to: '/admin/locations', label: 'Locations', icon: '📍' },
  { to: '/admin/payouts', label: 'Payouts', icon: '💰' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍' },
  { to: '/admin/system-health', label: 'System Health', icon: '❤️' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  const initial = (user?.fullName ?? user?.email ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">
          <div className="app-sidebar-logo-icon">T</div>
          <span className="app-sidebar-logo-name">Toureez</span>
          <span className="app-logo-badge purple">Admin</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-sidebar-user">
            <div className="app-sidebar-avatar" style={{ background: '#8B5CF6' }}>{initial}</div>
            <div style={{ minWidth: 0 }}>
              <div className="app-sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName ?? user?.email}
              </div>
              <div className="app-sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'none', color: 'var(--danger)', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background .15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(214,76,76,.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
