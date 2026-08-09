import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/api';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello. I'm here to share general mental-wellness information, coping strategies, and relaxation techniques.\n\nI'm not a therapist or doctor and cannot diagnose conditions or replace medical care. How can I support you today?",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const query = text.trim();
    if (!query || loading) return;

    setInput('');
    setLoading(true);

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const chatHistory = updatedMessages.slice(1, -1); // exclude welcome + current
      const result = await sendMessage(query, chatHistory);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: result.response,
          sources: result.sources || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: "I'm sorry, I encountered an error connecting to the server. Please check the backend is running and try again.",
          sources: [],
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const suggestions = [
    "What are healthy ways to cope with stress?",
    "Give me a 5-minute breathing exercise.",
    "What is the 5-4-3-2-1 grounding technique?",
    "When should I seek professional help?",
  ];

  return (
    <div className="chat-page container-limit">
      {/* Messages */}
      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>

            {/* AI avatar dot */}
            {msg.sender === 'assistant' && (
              <div className="avatar-dot ai" title="SereneSpace AI">SS</div>
            )}

            <div>
              {/* Sender label */}
              <div className="bubble-label">
                {msg.sender === 'user' ? 'You' : 'SereneSpace'}
              </div>

              {/* Bubble */}
              <div
                className="message-bubble"
                style={msg.isError ? {
                  borderColor: 'var(--crisis-color)',
                  backgroundColor: 'var(--crisis-light)'
                } : {}}
              >
                <div>{msg.text}</div>

                {/* Citations */}
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
            <div>
              <div className="bubble-label">SereneSpace</div>
              <div className="message-bubble" style={{ padding: '0.9rem 1.25rem' }}>
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips — shown only when chat is fresh */}
      {messages.length === 1 && !loading && (
        <div className="suggestion-chips">
          <span className="chip-label">Suggested questions:</span>
          {suggestions.map((s, i) => (
            <button key={i} className="chip" onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSubmit}>
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
  );
}
