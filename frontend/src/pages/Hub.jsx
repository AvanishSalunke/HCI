import React from 'react';
import { Link } from 'react-router-dom';
import { modules } from '../modules';
import './Hub.css';

function Hub() {
  return (
    <div className="hub-container">
      <header className="hub-hero">
        <div className="hub-hero-panel" data-aos="fade-up">
          <img src="/vjti-logo.jpg" alt="VJTI" className="hub-logo" />
          <h1>VJTI Management &amp; Automation System</h1>
          <p>
            One portal for the everyday running of Veermata Jijabai Technological
            Institute. Choose a module to get started.
          </p>
        </div>
      </header>

      <section className="hub-section">
        <div className="hub-section-header">
          <h2>Modules</h2>
          <p>Select a module to continue.</p>
        </div>

        <div className="hub-grid">
          {modules.map((m, index) => {
            const live = Boolean(m.path);
            const body = (
              <>
                <div className="hub-card-icon">{m.icon}</div>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                <span className={`hub-card-tag ${live ? 'live' : 'soon'}`}>
                  {live ? 'Open →' : 'Coming Soon'}
                </span>
              </>
            );
            return live ? (
              <Link
                to={m.path}
                className="hub-card"
                key={m.id}
                data-aos="fade-up"
                data-aos-delay={index * 80}
              >
                {body}
              </Link>
            ) : (
              <div
                className="hub-card disabled"
                key={m.id}
                aria-disabled="true"
                data-aos="fade-up"
                data-aos-delay={index * 80}
              >
                {body}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Hub;
