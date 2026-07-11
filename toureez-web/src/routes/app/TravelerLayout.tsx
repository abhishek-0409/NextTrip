import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/app/search', label: 'Destinations' },
  { to: '/app/search', label: 'Experiences' },
  { to: '/app/search', label: 'Deals' },
  { to: '/app/enquiries', label: 'Guides' },
  { to: '/app/enquiries', label: 'About' },
  { to: '/app/enquiries', label: 'Contact' },
];

export default function TravelerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  const loginHref = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/app" className="site-logo" end>
            <span className="site-logo-mark">N</span>
          </NavLink>
          <nav className="site-nav-links">
            {links.map((l) => (
              <NavLink key={l.label} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-actions">
            {user ? (
              <>
                <NavLink to="/app/profile" className="site-actions-profile">{user.fullName ?? 'Profile'}</NavLink>
                <button className="site-actions-login" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/app/profile" className="site-actions-profile">Profile</NavLink>
                <NavLink to={loginHref} className="site-actions-login">Login</NavLink>
              </>
            )}
            <button className="hamburger-btn" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav">
            {links.map((l) => (
              <NavLink key={l.label} to={l.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <Outlet />
    </div>
  );
}
