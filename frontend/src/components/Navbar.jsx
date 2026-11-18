import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  // On the hub the brand is the whole system; inside a module it is that module.
  const isHub = useLocation().pathname === '/';

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        <Link to={isHub ? '/' : '/committees'} className="navbar-brand">
          <img src="/vjti-logo.jpg" alt="VJTI" className="navbar-logo" />
          {isHub
            ? <span>VJTI Management &amp; Automation System</span>
            : <span>Committee Coordinator <em>VJTI</em></span>}
        </Link>

        {!isHub && (
          <div className="navbar-links">
            <NavLink to="/" end className="nav-link">All Modules</NavLink>
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
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
