import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import FloatingChat from '../../components/FloatingChat';

const NAV_LINKS = [
  { to: '/app/search', label: 'Destinations' },
  { to: '/app/search?trip_type=domestic', label: 'Domestic' },
  { to: '/app/search?trip_type=international', label: 'International' },
  { to: '/app/compare', label: 'Compare' },
];

export default function TravelerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  const loginHref = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="site">
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="site-header-inner">
          <NavLink to="/app" className="site-logo" end>
            <span className="site-logo-icon">T</span>
            <span className="site-logo-text">Toureez</span>
          </NavLink>

          <nav className="site-nav-links">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.label} to={l.to}>{l.label}</NavLink>
            ))}
          </nav>

          <div className="site-actions">
            {user ? (
              <>
                <NavLink to="/app/bookings" className="site-actions-profile">
                  Bookings
                </NavLink>
                <NavLink to="/app/wishlist" className="site-actions-profile">
                  Saved
                </NavLink>
                <NavLink to="/app/profile" title={user.fullName ?? user.email ?? ''}>
                  <div className="site-avatar">{initials}</div>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to={loginHref} className="site-actions-profile">
                  Sign in
                </NavLink>
                <NavLink to="/auth/signup" className="btn btn-primary btn-sm btn-pill">
                  Get started
                </NavLink>
              </>
            )}
            <button
              className="hamburger-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mobile-nav">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.label} to={l.to}>{l.label}</NavLink>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            {user ? (
              <>
                <NavLink to="/app/bookings">My Bookings</NavLink>
                <NavLink to="/app/wishlist">Saved Trips</NavLink>
                <NavLink to="/app/enquiries">Enquiries</NavLink>
                <NavLink to="/app/profile">Profile</NavLink>
                <button
                  onClick={handleLogout}
                  style={{ color: 'var(--danger)', fontWeight: 600 }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to={loginHref} style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</NavLink>
                <NavLink to="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create account</NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <Outlet />
      <FloatingChat />
    </div>
  );
}
