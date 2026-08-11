import React, { useState, useEffect } from 'react';

const LS_MOODS = 'serenespace-moods';

const MOOD_OPTIONS = [
  { score: 1, emoji: '😢', label: 'Sad', color: '#B25E5E', bg: '#FDF3F3' },
  { score: 2, emoji: '😰', label: 'Stressed', color: '#D97706', bg: '#FFFBEB' },
  { score: 3, emoji: '😐', label: 'Neutral', color: '#707070', bg: '#F5F3EE' },
  { score: 4, emoji: '😌', label: 'Calm', color: '#7A8B75', bg: '#EEF3ED' },
  { score: 5, emoji: '😊', label: 'Happy', color: '#4F772D', bg: '#EDF4E8' }
];

const TAG_OPTIONS = [
  { name: 'Sleep', icon: '💤' },
  { name: 'Work', icon: '💼' },
  { name: 'Social', icon: '🤝' },
  { name: 'Exercise', icon: '🏃‍♂️' },
  { name: 'Diet', icon: '🍏' },
  { name: 'Hobby', icon: '🎨' },
  { name: 'Outdoors', icon: '🌲' }
];

export default function MoodTracker() {
  const [entries, setEntries] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Load entries on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_MOODS)) || [];
      // Sort by date descending for list view, but we'll sort chronologically for the trend chart
      const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(sorted);
    } catch (e) {
      console.error("Failed to load mood history", e);
    }
  }, []);

  const handleToggleTag = (tagName) => {
    setSelectedTags(prev => 
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!selectedMood) return;

    const newEntry = {
      id: `mood-${Date.now()}`,
      date: new Date().toISOString(),
      score: selectedMood.score,
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      tags: selectedTags,
      note: note.trim()
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(LS_MOODS, JSON.stringify(updated));

    // Reset form
    setSelectedMood(null);
    setSelectedTags([]);
    setNote('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this mood log?")) {
      const updated = entries.filter(entry => entry.id !== id);
      setEntries(updated);
      localStorage.setItem(LS_MOODS, JSON.stringify(updated));
    }
  };

  // Helper: Format date for display
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get last 7 entries chronologically for the trend chart
  const trendEntries = [...entries]
    .slice(0, 7)
    .reverse();

  // Compute stats
  const averageMood = entries.length > 0 
    ? (entries.reduce((acc, curr) => acc + curr.score, 0) / entries.length).toFixed(1)
    : 'N/A';

  const mostFrequentMood = () => {
    if (entries.length === 0) return 'N/A';
    const counts = {};
    entries.forEach(e => { counts[e.label] = (counts[e.label] || 0) + 1; });
    let maxLabel = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([label, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxLabel = label;
      }
    });
    const moodObj = MOOD_OPTIONS.find(m => m.label === maxLabel);
    return moodObj ? `${moodObj.emoji} ${moodObj.label}` : maxLabel;
  };

  return (
    <div className="exercises-page container-limit">
      <div className="exercises-header">
        <h2>Mood Tracker & Insights</h2>
        <p>Log your daily emotional state, track your personal activities, and view mindfulness insights over time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }} className="mood-dashboard-layout">
        
        {/* Main Check-In Form */}
        <div className="card-container" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✍️</span> How are you feeling right now?
          </h3>
          
          {showSuccess && (
            <div style={{
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-color)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--border-radius-sm)',
              marginBottom: '1.5rem',
              fontWeight: '500',
              animation: 'fadeSlideUp 0.3s ease-out'
            }}>
              ✨ Your mood has been logged successfully. Check out your updated insights below!
            </div>
          )}

          <form onSubmit={handleSaveEntry}>
            {/* Mood Emojis Select */}
            <div className="mood-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood?.score === mood.score;
                return (
                  <button
                    key={mood.score}
                    type="button"
                    className={`mood-option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1rem 0.5rem',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: isSelected ? mood.bg : 'var(--bg-card)',
                      borderColor: isSelected ? mood.color : 'var(--border-color)',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      outline: 'none'
                    }}
                  >
                    <span style={{ fontSize: '2rem', marginBottom: '0.25rem', transform: isSelected ? 'scale(1.15)' : 'none', transition: 'transform 0.2s' }}>
                      {mood.emoji}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? mood.color : 'var(--text-secondary)'
                    }}>
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Activities Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: '600' }}>
                Select Activities / Influences:
              </h4>
              <div className="mood-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleTag(tag.name)}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? '600' : '400'
                      }}
                    >
                      <span style={{ marginRight: '0.25rem' }}>{tag.icon}</span>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Area */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: '600' }}>
                Reflections & Gratitude Notes:
              </h4>
              <textarea
                className="chat-input"
                style={{ 
                  width: '100%', 
                  borderRadius: 'var(--border-radius-md)', 
                  padding: '0.75rem 1rem', 
                  minHeight: '80px',
                  resize: 'vertical',
                  fontSize: '0.92rem'
                }}
                placeholder="What triggered this feeling? Add any thoughts or points of gratitude..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!selectedMood}
                style={{ opacity: selectedMood ? 1 : 0.6, cursor: selectedMood ? 'pointer' : 'not-allowed' }}
              >
                💾 Save Entry
              </button>
            </div>
          </form>
        </div>

        {/* Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Key Metrics */}
          <div className="card-container" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '700' }}>📊 Analytics Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Total Checked-Ins</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-color)' }}>{entries.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Average Mood Score</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-color)' }}>
                  {averageMood} <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>/ 5.0</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Most Frequent Mood</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{mostFrequentMood()}</span>
              </div>
            </div>
          </div>

          {/* SVG Line Trend Chart */}
          <div className="card-container" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '700' }}>📈 Mood Trend (Last 7 Logs)</h3>
            {trendEntries.length < 2 ? (
              <div style={{
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                fontSize: '0.86rem',
                border: '1.5px dashed var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}>
                Need at least 2 logs to visualize your mood trend line. Keep tracking!
              </div>
            ) : (
              <div className="trend-chart-wrapper" style={{ position: 'relative', padding: '0.5rem 0' }}>
                <svg viewBox="0 0 400 150" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  {/* Grid Lines & Labels */}
                  {[1, 2, 3, 4, 5].map((level) => {
                    const y = 135 - (level - 1) * 25;
                    const moodLabel = MOOD_OPTIONS.find(m => m.score === level)?.emoji || '';
                    return (
                      <g key={level}>
                        <line 
                          x1="30" 
                          y1={y} 
                          x2="390" 
                          y2={y} 
                          stroke="var(--border-color)" 
                          strokeWidth="1" 
                          strokeDasharray="4,4" 
                        />
                        <text x="5" y={y + 4} fill="var(--text-secondary)" fontSize="10">{moodLabel}</text>
                      </g>
                    );
                  })}

                  {/* Trend Path */}
                  {(() => {
                    const width = 360;
                    const xSpacing = trendEntries.length > 1 ? width / (trendEntries.length - 1) : 0;
                    
                    const points = trendEntries.map((e, idx) => {
                      const x = 30 + idx * xSpacing;
                      const y = 135 - (e.score - 1) * 25;
                      return { x, y, ...e };
                    });

                    const pathData = points.reduce((acc, p, idx) => 
                      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, 
                      ''
                    );

                    return (
                      <g>
                        {/* Gradient below line */}
                        <path
                          d={`${pathData} L ${points[points.length - 1].x} 135 L 30 135 Z`}
                          fill="url(#chart-gradient)"
                          opacity="0.15"
                        />
                        
                        {/* Define gradients */}
                        <defs>
                          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-color)" />
                            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Actual trend line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="var(--accent-color)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Point circles */}
                        {points.map((p, idx) => (
                          <g key={p.id}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="5"
                              fill="var(--bg-card)"
                              stroke="var(--accent-color)"
                              strokeWidth="2"
                            />
                            {/* Tiny date label below each circle */}
                            <text
                              x={p.x}
                              y="148"
                              textAnchor="middle"
                              fill="var(--text-secondary)"
                              fontSize="8"
                              fontWeight="500"
                            >
                              {new Date(p.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* History Logs */}
        <div className="card-container" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>📖 Reflections History</h3>

          {entries.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              color: 'var(--text-secondary)',
              border: '1.5px dashed var(--border-color)',
              borderRadius: 'var(--border-radius-lg)'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🍃</span>
              <p style={{ fontWeight: '500', fontSize: '0.98rem' }}>No mood logs recorded yet.</p>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Your entries will show up here to help you track triggers and build self-awareness.</p>
            </div>
          ) : (
            <div className="mood-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="mood-history-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    position: 'relative',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {/* Top line with emoji, date and delete button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.75rem' }}>{entry.emoji}</span>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {entry.label}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {formatDate(entry.date)}
                        </div>
                      </div>
                    </div>

                    <button
                      className="chat-toolbar-btn"
                      onClick={() => handleDeleteEntry(entry.id)}
                      style={{
                        padding: '0.35rem',
                        color: 'var(--crisis-color)',
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        borderRadius: '50%',
                        cursor: 'pointer'
                      }}
                      title="Delete log"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>

                  {/* Notes / Reflection text */}
                  {entry.note && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      lineHeight: '1.5',
                      margin: '0.4rem 0 0.6rem 0',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'var(--bg-card)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--border-radius-sm)',
                      borderLeft: '3px solid var(--accent-color)'
                    }}>
                      {entry.note}
                    </p>
                  )}

                  {/* Associated activity tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {entry.tags.map((tag) => {
                        const icon = TAG_OPTIONS.find(t => t.name === tag)?.icon || '✨';
                        return (
                          <span 
                            key={tag} 
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '12px',
                              color: 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <span>{icon}</span> {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
