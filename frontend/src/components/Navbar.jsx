import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const DASHBOARD_FOR_ROLE = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  admin: '/admin-dashboard',
};

function Navbar() {
  const navigate = useNavigate();
  useLocation(); // re-check the saved login whenever the page changes

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
    navigate('/');
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
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
