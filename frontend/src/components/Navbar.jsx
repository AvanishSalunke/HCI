import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
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
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
