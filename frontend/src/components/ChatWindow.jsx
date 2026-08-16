import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage } from '../services/api';
import HistorySidebar from './HistorySidebar';

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_HISTORY = 'serenespace-history';
const LS_SESSION = 'serenespace-current-session';

const WELCOME_MSG = {
  id: 1,
  sender: 'assistant',
  text: "Hey, I'm really glad you're here. 💙\n\nI'm SereneSpace — a mental wellness companion. Whether you're feeling overwhelmed, anxious, struggling to sleep, or just need someone to talk to, I'm here for you.\n\nHow are you feeling today? You can share as little or as much as you'd like.",
  sources: []
};

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; }
  catch { return []; }
}

function saveHistory(sessions) {
  localStorage.setItem(LS_HISTORY, JSON.stringify(sessions));
}

function newSessionId() {
  return `session-${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWindow() {
  const [sessions, setSessions]             = useState(loadHistory);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem(LS_SESSION) || null);
  const [messages, setMessages]             = useState([WELCOME_MSG]);
  const [input, setInput]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [historyOpen, setHistoryOpen]       = useState(false);

  const messagesEndRef = useRef(null);

  // Restore last session on mount
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && session.messages.length > 1) {
        setMessages(session.messages);
        return;
      }
    }
    setMessages([WELCOME_MSG]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persist current session ID
  useEffect(() => {
    if (currentSessionId) localStorage.setItem(LS_SESSION, currentSessionId);
  }, [currentSessionId]);

  // ── Save messages into sessions whenever messages change ──────────────────
  const persistMessages = useCallback((msgs, sessionId) => {
    if (msgs.length <= 1) return; // only the welcome msg — nothing to save

    const firstUserMsg = msgs.find(m => m.sender === 'user');
    const title = firstUserMsg
      ? (firstUserMsg.text.length > 52 ? firstUserMsg.text.slice(0, 52) + '…' : firstUserMsg.text)
      : 'Conversation';

    setSessions(prev => {
      const existing = prev.findIndex(s => s.id === sessionId);
      const updated = {
        id: sessionId,
        title,
        date: existing >= 0 ? prev[existing].date : new Date().toISOString(),
        messages: msgs
      };
      const next = existing >= 0
        ? prev.map((s, i) => i === existing ? updated : s)
        : [...prev, updated];
      saveHistory(next);
      return next;
    });
  }, []);

  // ── Send a message ─────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const query = text.trim();
    if (!query || loading) return;

    // Ensure we have a session ID
    const sessionId = currentSessionId || newSessionId();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    setInput('');
    setLoading(true);

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const chatHistory = updatedMessages.slice(1, -1);
      const result = await sendMessage(query, chatHistory);

      setMessages(prev => {
        const next = [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.response,
            sources: result.sources || []
          }
        ];
        persistMessages(next, sessionId);
        return next;
      });
    } catch {
      setMessages(prev => {
        const next = [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: "I'm sorry, I encountered an error connecting to the server. Please check the backend is running and try again.",
            sources: [],
            isError: true
          }
        ];
        persistMessages(next, sessionId);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); handleSend(input); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  // ── History actions ────────────────────────────────────────────────────────
  const handleNewChat = () => {
    setCurrentSessionId(null);
    localStorage.removeItem(LS_SESSION);
    setMessages([WELCOME_MSG]);
    setInput('');
  };

  const handleLoadSession = (id) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    setCurrentSessionId(id);
    setMessages(session.messages);
    setInput('');
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      saveHistory(next);
      return next;
    });
    if (id === currentSessionId) handleNewChat();
  };

  // ── Suggestions ───────────────────────────────────────────────────────────
  const suggestions = [
    "What are healthy ways to cope with stress?",
    "Give me a 5-minute breathing exercise.",
    "What is the 5-4-3-2-1 grounding technique?",
    "When should I seek professional help?",
  ];

  return (
    <>
      <HistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
      />

      <div className="chat-page">
        {/* Messages */}
        <div className="chat-messages-container container-limit">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>

              {msg.sender === 'assistant' && (
                <div className="avatar-dot ai" title="SereneSpace AI">SS</div>
              )}

              <div className="message-content-wrapper">
                <div className="bubble-label">
                  {msg.sender === 'user' ? 'You' : 'SereneSpace'}
                </div>

                <div
                  className="message-bubble"
                  style={msg.isError ? {
                    borderColor: 'var(--crisis-color)',
                    backgroundColor: 'var(--crisis-light)'
                  } : {}}
                >
                  <div>{msg.text}</div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-container">
                      <div className="sources-title">Verified Sources</div>
                      <div className="sources-list">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-tag"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/>
                              <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            {src.organization} — {src.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="message-row assistant">
              <div className="avatar-dot ai">SS</div>
              <div className="message-content-wrapper">
                <div className="bubble-label">SereneSpace</div>
                <div className="message-bubble" style={{ padding: '0.85rem 1.25rem' }}>
                  <div className="typing-indicator">
                    <div className="typing-dots-row">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                    <span className="typing-label">SereneSpace is thinking…</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length === 1 && !loading && (
          <div className="suggestion-chips container-limit">
            <span className="chip-label">Suggested questions:</span>
            {suggestions.map((s, i) => (
              <button key={i} className="chip" onClick={() => handleSend(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="chat-input-area">
          {/* Toolbar row */}
          <div className="chat-toolbar container-limit">
            <button
              className="chat-toolbar-btn"
              onClick={() => setHistoryOpen(true)}
              title="View chat history"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              History
              {sessions.length > 0 && (
                <span className="chat-toolbar-badge">{sessions.length}</span>
              )}
            </button>

            <button
              className="chat-toolbar-btn"
              onClick={handleNewChat}
              title="Start a new conversation"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
              New Chat
            </button>
          </div>

          {/* Input form */}
          <form className="chat-input-form container-limit" onSubmit={handleSubmit}>
            <input
              className="chat-input"
              type="text"
              placeholder="Ask about stress, coping, relaxation..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={loading || !input.trim()}
              title="Send message"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
