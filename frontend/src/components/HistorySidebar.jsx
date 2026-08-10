import React, { useMemo } from 'react';

export default function HistorySidebar({ isOpen, onClose, sessions, currentSessionId, onLoadSession, onDeleteSession, onNewChat }) {

  // Group sessions by date label
  const grouped = useMemo(() => {
    const now = new Date();
    const groups = {};

    [...sessions].reverse().forEach(session => {
      const d = new Date(session.date);
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      let label;
      if (diffDays === 0) label = 'Today';
      else if (diffDays === 1) label = 'Yesterday';
      else if (diffDays < 7) label = 'This Week';
      else if (diffDays < 30) label = 'This Month';
      else label = 'Older';

      if (!groups[label]) groups[label] = [];
      groups[label].push(session);
    });

    return groups;
  }, [sessions]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`history-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside className={`history-sidebar ${isOpen ? 'open' : ''}`} aria-label="Chat history">
        {/* Header */}
        <div className="history-sidebar-header">
          <div className="history-sidebar-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Chat History
          </div>
          <button className="history-close-btn" onClick={onClose} title="Close history">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="history-new-chat-wrap">
          <button className="history-new-chat-btn" onClick={() => { onNewChat(); onClose(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="history-list">
          {sessions.length === 0 ? (
            <div className="history-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: 0.3, marginBottom: '0.75rem' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>No conversations yet.</p>
              <p>Start chatting to build your history.</p>
            </div>
          ) : (
            groupOrder.map(label => {
              if (!grouped[label]) return null;
              return (
                <div key={label} className="history-group">
                  <div className="history-group-label">{label}</div>
                  {grouped[label].map(session => (
                    <div
                      key={session.id}
                      className={`history-item ${session.id === currentSessionId ? 'active' : ''}`}
                      onClick={() => { onLoadSession(session.id); onClose(); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && (onLoadSession(session.id), onClose())}
                    >
                      <div className="history-item-content">
                        <div className="history-item-title">{session.title}</div>
                        <div className="history-item-meta">
                          <span>{session.messages.length - 1} message{session.messages.length !== 2 ? 's' : ''}</span>
                          <span>{formatTime(session.date)}</span>
                        </div>
                      </div>
                      <button
                        className="history-item-delete"
                        onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
                        title="Delete conversation"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
