import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { committees } from '../committees';
import { API_BASE } from '../api';
import { formatDateRange, formatTime } from '../eventUtils';
import './Welcome.css';

const BullhornIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 0 1 9 3v.75h6V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75zm-1.5 5.25v9.75h10.5V7.5H6.75z" clipRule="evenodd" />
  </svg>
);

function Welcome() {
  const [announcements, setAnnouncements] = useState([]);

  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/events`, { params: { limit: 50 } })
      .then(res => setRecentEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  const committeeName = (id) => committees.find(c => c.id === id)?.name || id;

  useEffect(() => {
    axios.get(`${API_BASE}/api/announcements`)
      .then(res => setAnnouncements(res.data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="welcome-container-aesthetic">

      {/* HERO */}
      <header className="aesthetic-hero">
        <div className="hero-text-panel" data-aos="fade-right">
          <img src="/vjti-logo.jpg" alt="VJTI" className="hero-logo" />
          <h1>Committee Coordinator <span className="hero-vjti">VJTI</span></h1>
          <p>
            Track expenses, manage sponsorships, and keep your committee's
            finances in one place. Built for VJTI committees.
          </p>
          <div className="hero-actions">
            <a href="#committee-grid" className="btn btn-primary">
              Get Started
            </a>
            <Link to="/feedback" className="btn btn-outline-light">
              Give Event Feedback
            </Link>
          </div>
        </div>

        {/* FEEDBACK: fills the whole right side of the hero */}
        <aside className="home-feedback" data-aos="fade-left">
          <div className="home-feedback-head">
            <div>
              <span className="home-feedback-eyebrow">Reach out to us</span>
              <h2>Event Feedback</h2>
              <p>Attended a recent event? Pick an event below and tell the committee how it went. No login needed.</p>
            </div>
            <Link to="/feedback" className="btn btn-primary home-feedback-all">All events &rarr;</Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="home-feedback-empty">
              No events have been posted yet. Check back after the next event.
            </div>
          ) : (
            <div className="home-feedback-list">
              {recentEvents.map(ev => (
                <Link
                  to={`/feedback?committee=${ev.committee}&event=${ev._id}`}
                  className="home-event-row"
                  key={ev._id}
                >
                  <div className="home-event-main">
                    <span className="home-event-tag" title={committeeName(ev.committee)}>{committeeName(ev.committee)}</span>
                    <h3>{ev.name}</h3>
                  </div>
                  <div className="home-event-when">
                    <span className="home-event-date">{formatDateRange(ev.date, ev.endDate)}</span>
                    <span className="home-event-time">{formatTime(ev.startTime)} – {formatTime(ev.endTime)}</span>
                  </div>
                  <span className="home-event-go">Give feedback &rarr;</span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </header>

      {/* ANNOUNCEMENTS */}
      <section className="announcements-container" data-aos="fade-up">
        <div className="announcements-header">
          <h2>Announcements</h2>
          <p>Updates from the administration</p>
        </div>
        <div className="announcements-list">
          {announcements.length === 0 && (
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>No announcements yet.</p>
          )}
          {announcements.map((ann) => (
            <div className="announcement-card" key={ann._id}>
              <div className="announcement-icon"><BullhornIcon /></div>
              <div className="announcement-content">
                <h3>{ann.title}</h3>
                <span className="announcement-date">
                  {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
                <p>{ann.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="view-all-container">
          <Link to="/announcements" className="btn-view-all">
            View All Announcements &rarr;
          </Link>
        </div>
      </section>

      {/* COMMITTEE GRID */}
      <section className="committee-grid-section" id="committee-grid" data-aos="fade-up">
        <div className="committee-grid-header">
          <h2>Committees</h2>
          <p>Select your committee to log in.</p>
        </div>
        <div className="committee-grid">
          {committees.map((committee, index) => (
            <Link
              to={`/login/${committee.id}`}
              className="committee-card-flip"
              key={committee.id}
              data-aos="flip-left"
              data-aos-delay={index * 50}
            >
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="card-aesthetic-logo">
                    <img src={committee.logo} alt={committee.name} />
                  </div>
                  <div className="card-aesthetic-name">
                    <h3>{committee.name}</h3>
                  </div>
                </div>
                <div className="flip-back">
                  <span>Login as</span>
                  <h3>{committee.name}</h3>
                  <div className="flip-back-arrow">→</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Welcome;
