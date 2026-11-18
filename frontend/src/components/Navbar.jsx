import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { pushSupported, enableNotifications, syncSubscription } from '../push';
import './Navbar.css';

const DASHBOARD_FOR_ROLE = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  admin: '/admin-dashboard',
};

function Navbar() {
  const navigate = useNavigate();
  useLocation(); // re-check the saved login whenever the page changes

  const [installPrompt, setInstallPrompt] = useState(null);
  const [permission, setPermission] = useState(
    pushSupported() ? Notification.permission : 'unavailable'
  );

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

        <div className="navbar-links">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink
            to="/feedback"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Give Feedback
          </NavLink>
          <NavLink
            to="/announcements"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            All Announcements
          </NavLink>
          <NavLink
            to="/faculty"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Faculty Advisors
          </NavLink>
          {loggedIn ? (
            <>
              <NavLink
                to={DASHBOARD_FOR_ROLE[user.role] || '/'}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                My Dashboard
              </NavLink>
              <button type="button" className="nav-link nav-logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => isActive ? 'nav-link nav-login active' : 'nav-link nav-login'}
            >
              Login
            </NavLink>
          )}
          {permission === 'default' && (
            <button type="button" className="nav-link nav-logout" onClick={handleEnableNotifications}>
              Get notifications
            </button>
          )}
          {installPrompt && (
            <button type="button" className="nav-link nav-logout" onClick={handleInstall}>
              Install app
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
