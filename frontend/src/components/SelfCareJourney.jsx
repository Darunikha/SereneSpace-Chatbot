import React, { useState } from 'react';

export default function SelfCareJourney() {
  const [duration, setDuration] = useState(null); // null, 5, 10, 20

  const routines = {
    5: {
      morning: [
        'Short stretch: Reach your arms high overhead and roll your wrists (1 min)',
        'Hydration: Drink one full glass of water to wake up your body (1 min)',
        'Intention setting: Think of one simple goal for the day (e.g., "Stay calm under stress") (30 seconds)'
      ],
      afternoon: [
        'Eye break: Practice the 20-20-20 rule (look 20 feet away for 20 seconds) (1 min)',
        'Posture reset: Roll your shoulders backward three times and sit up straight (1 min)',
        'Mindful breath: Take three slow, conscious breaths (1 min)'
      ],
      evening: [
        'Gratitude journal: Jot down or think of one thing you are grateful for today (1 min)',
        'Screen-free gap: Disconnect from all screens 5 minutes before close (1 min)',
        'Release: Exhale completely and let go of any tension from the workday (1 min)'
      ]
    },
    10: {
      morning: [
        'Grounding stretch: Gentle neck rolls and side stretches (2 mins)',
        'Hydration check: Large glass of water (1 min)',
        'Intention & Gratitude: Write down two things you are glad to have today (2 mins)',
        'Quiet breathing: Sitting still with eyes closed, counting breaths (5 mins)'
      ],
      afternoon: [
        'Desk break: Stand up and stretch your back, chest, and arms (3 mins)',
        'Hydration: Drink water or a calming herbal tea (2 mins)',
        'Step away: Take a short walk around the room or look out the window (5 mins)'
      ],
      evening: [
        'Journaling prompt: Write down: "What is one thing that went well today and why?" (4 mins)',
        'Wind-down stretch: Sit on the floor, stretch legs and fold forward (3 mins)',
        'Box Breathing: 3 cycles of Box Breathing (inhale 4, hold 4, exhale 4, hold 4) (3 mins)'
      ]
    },
    20: {
      morning: [
        'Mindful breathing: Box breathing exercise (5 mins)',
        'Yoga stretches: Gentle cat-cow and child\'s pose stretches (6 mins)',
        'Hydration & Fuel: Drink water and eat a small, balanced bite (4 mins)',
        'Intention planner: Write down the top 3 priorities for today, drawing boundaries (5 mins)'
      ],
      afternoon: [
        'Nature walk: Walk outside or in a quiet corridor, focusing on sounds (8 mins)',
        'Hydration: Drink cold water, feeling the cool temperature (3 mins)',
        'PMR preview: Squeeze and release shoulders and arms to relieve screen tension (4 mins)',
        'Mind dump: Write down all current worries on paper, then set the paper aside (5 mins)'
      ],
      evening: [
        'Muscle release: Progressive Muscle Relaxation (PMR) for feet, legs, and chest (8 mins)',
        'Reflective journaling: Reflect on a lesson learned or a pleasant moment today (6 mins)',
        'Digital disconnect: Turn off phone/PC, dim lights, and sit quietly (6 mins)'
      ]
    }
  };

  return (
    <div className="journey-page container-limit">
      <div className="journey-header">
        <h2>Your Self-Care Journey</h2>
        <p>Build healthy, sustainable routines. Select a short duration below to generate a simple wellness guide.</p>
      </div>

      {!duration ? (
        <div className="card-container wizard-step">
          <h3>How much time do you have to spare?</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Even a 5-minute break can help reset your mental state.</p>
          <div className="wizard-options">
            <button className="wizard-btn" onClick={() => setDuration(5)}>
              5 Minutes
            </button>
            <button className="wizard-btn" onClick={() => setDuration(10)}>
              10 Minutes
            </button>
            <button className="wizard-btn" onClick={() => setDuration(20)}>
              20 Minutes
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Your Custom {duration}-Minute Routine</h3>
            <button className="btn btn-secondary" onClick={() => setDuration(null)}>
              Change Duration
            </button>
          </div>

          <div className="routine-timeline">
            <div className="routine-block morning">
              <span className="routine-time-label">Morning Routine</span>
              <h3>Start Mindfully</h3>
              <ul>
                {routines[duration].morning.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="routine-block afternoon">
              <span className="routine-time-label">Afternoon Reset</span>
              <h3>Maintain Balance</h3>
              <ul>
                {routines[duration].afternoon.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="routine-block evening">
              <span className="routine-time-label">Evening Unwind</span>
              <h3>Release Tension</h3>
              <ul>
                {routines[duration].evening.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)' }}>
            Source: NIMH & WHO — Coping with Stress & Self-Care Guidelines
          </div>
        </div>
      )}
    </div>
  );
}
