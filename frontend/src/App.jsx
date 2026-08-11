import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Disclaimer from './components/Disclaimer';
import LandingPage from './components/LandingPage';
import ChatWindow from './components/ChatWindow';
import Exercises from './components/Exercises';
import SelfCareJourney from './components/SelfCareJourney';
import MoodTracker from './components/MoodTracker';
import { checkHealth } from './services/api';
import './styles/App.css';

export default function App() {
  const [view, setView] = useState('home');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dbLoaded, setDbLoaded] = useState(false);

  // Dark mode: read from localStorage on first mount
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('serenespace-theme') === 'dark';
  });

  // Apply / remove dark mode attribute on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('serenespace-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('serenespace-theme', 'light');
    }
  }, [darkMode]);

  // Backend health check
  useEffect(() => {
    async function verifyBackend() {
      try {
        const health = await checkHealth();
        if (health && health.status === 'healthy') {
          setBackendStatus('healthy');
          setDbLoaded(health.vector_store_loaded);
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    }
    verifyBackend();
  }, []);

  const handleNavigate = (newView) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDarkMode = () => setDarkMode((d) => !d);

  return (
    <div className="app-container">
      <Disclaimer onNavigate={handleNavigate} />

      <Header
        currentView={view}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
      />

      {/* Status banners */}
      {backendStatus === 'offline' && (
        <div style={{
          backgroundColor: 'var(--crisis-light)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.4rem 0',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--crisis-color)',
          fontWeight: '600'
        }}>
          Backend server is offline or loading. Chat will use local fallback information.
        </div>
      )}

      {backendStatus === 'healthy' && !dbLoaded && (
        <div style={{
          backgroundColor: '#FFFBEB',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.4rem 0',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#B45309',
          fontWeight: '600'
        }}>
          Vector database is empty. Documents will be ingested automatically on first query.
        </div>
      )}

      <main className="main-content">
        {view === 'home'      && <LandingPage onNavigate={handleNavigate} />}
        {view === 'chat'      && <ChatWindow />}
        {view === 'exercises' && <Exercises />}
        {view === 'journey'   && <SelfCareJourney />}
        {view === 'mood'      && <MoodTracker />}
      </main>

      <footer className="app-footer">
        <div className="container-limit">
          <p>© {new Date().getFullYear()} SereneSpace — Resources cited from verified public healthcare publications.</p>
        </div>
      </footer>
    </div>
  );
}
