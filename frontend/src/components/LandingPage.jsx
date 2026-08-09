import React from 'react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page container-limit" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <section className="hero">
        <h1>Your space for mental wellness.</h1>
        <p>
          Evidence-based information, practical coping strategies, and simple self-care guidance. 
          Grounded in verified expert health resources.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('chat')}>
            Start Chatting
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('journey')}>
            Explore Self-Care
          </button>
        </div>
      </section>

      <section className="features-section">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.6rem', fontWeight: '600' }}>
          Wellness Features & Tools
        </h2>
        <div className="features-grid">
          <div className="feature-card" onClick={() => onNavigate('chat')}>
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Grounded Chat</h3>
            <p>
              Ask questions about stress, anxiety, or coping strategies, and receive advice cited from verified clinical sources.
            </p>
          </div>

          <div className="feature-card" onClick={() => onNavigate('exercises')}>
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <h3>Relaxation Exercises</h3>
            <p>
              Practice interactive Box Breathing with a visual pacer, Progressive Muscle Relaxation, and grounding techniques.
            </p>
          </div>

          <div className="feature-card" onClick={() => onNavigate('journey')}>
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>Self-Care Journey</h3>
            <p>
              Build structured, manageable routines for morning, afternoon, and evening. Choose standard intervals matching your schedule.
            </p>
          </div>

          <div className="feature-card" onClick={() => onNavigate('chat')}>
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Trusted Information</h3>
            <p>
              Direct reference citations to World Health Organization (WHO), CDC, and NHS materials for every mental health topic.
            </p>
          </div>

          <div className="feature-card" onClick={() => onNavigate('chat')}>
            <div className="feature-icon-wrapper" style={{ color: 'var(--crisis-color)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
              </svg>
            </div>
            <h3 style={{ color: 'var(--crisis-color)' }}>Professional Support</h3>
            <p>
              Easily access crisis lines, suicide prevention resources, and guidance on identifying when to consult a clinician.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
