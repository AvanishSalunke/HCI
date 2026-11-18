import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { pushSupported, enableNotifications, syncSubscription } from '../push';
import './Navbar.css';

const DASHBOARD_FOR_ROLE = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  admin: '/admin-dashboard',
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [permission, setPermission] = useState(
    pushSupported() ? Notification.permission : 'unavailable'
  );

  // close the phone menu whenever the page changes
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Chrome on Android offers the "install" prompt through this event
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // keep the server's record of this device up to date (e.g. after the site is reopened)
  useEffect(() => { syncSubscription(); }, []);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  const loggedIn = Boolean(user && localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    syncSubscription(); // this device is no longer tied to the account
    setMenuOpen(false);
    navigate('/');
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleEnableNotifications = async () => {
    const result = await enableNotifications();
    setPermission(result === 'unavailable' ? Notification.permission : result);
    if (result === 'unavailable') alert('Notifications could not be turned on right now.');
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-brand">
          <img src="/vjti-logo.jpg" alt="VJTI" className="navbar-logo" />
          <span>Committee Coordinator <em>VJTI</em></span>
        </Link>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>

        <div id="nav-menu" className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <div className="nav-main">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>
            <NavLink to="/announcements" className={linkClass}>Announcements</NavLink>
            <NavLink to="/faculty" className={linkClass}>Faculty</NavLink>
            {loggedIn && (
              <NavLink to={DASHBOARD_FOR_ROLE[user.role] || '/'} className={linkClass}>
                Dashboard
              </NavLink>
            )}
          </div>

          <div className="nav-actions">
            {permission === 'default' && (
              <button type="button" className="nav-icon-btn" onClick={handleEnableNotifications} title="Get notifications">
                <BellIcon /><span className="nav-label">Get notifications</span>
              </button>
            )}
            {installPrompt && (
              <button type="button" className="nav-icon-btn" onClick={handleInstall} title="Install app">
                <DownloadIcon /><span className="nav-label">Install app</span>
              </button>
            )}
            {loggedIn ? (
              <button type="button" className="nav-cta nav-cta-outline" onClick={handleLogout}>
                Log out
              </button>
            ) : (
              <NavLink to="/login" className="nav-cta">Login</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
