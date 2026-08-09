import React, { useState, useEffect } from 'react';

export default function Exercises() {
  const [activeTab, setActiveTab] = useState('breathing');

  return (
    <div className="exercises-page container-limit">
      <div className="exercises-header">
        <h2>Relaxation & Grounding Tools</h2>
        <p>Simple, interactive exercises to calm your nervous system and bring focus to the present moment.</p>
      </div>

      <div className="tab-bar">
        <button
          className={`btn ${activeTab === 'breathing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('breathing')}
        >
          Box Breathing
        </button>
        <button
          className={`btn ${activeTab === 'grounding' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('grounding')}
        >
          5-4-3-2-1 Grounding
        </button>
        <button
          className={`btn ${activeTab === 'pmr' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('pmr')}
        >
          Muscle Relaxation
        </button>
      </div>

      <div className="card-container">
        {activeTab === 'breathing' && <BoxBreathing />}
        {activeTab === 'grounding' && <GroundingTechnique />}
        {activeTab === 'pmr' && <PMRProgressive />}
      </div>
    </div>
  );
}

/* ==========================================
   BOX BREATHING COMPONENT
   ========================================== */
function BoxBreathing() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, inhale, hold, exhale, hold-empty
  const [secondsLeft, setSecondsLeft] = useState(4);

  const phaseDetails = {
    idle: { text: 'Click Start to begin Box Breathing', className: 'exhale', color: 'var(--text-secondary)' },
    inhale: { text: 'Breathe in slowly through your nose...', className: 'inhale', color: 'var(--accent-color)' },
    hold: { text: 'Hold your breath gently...', className: 'hold', color: '#6C7D67' },
    exhale: { text: 'Slowly release through your mouth...', className: 'exhale', color: 'var(--text-secondary)' },
    'hold-empty': { text: 'Hold empty before inhaling...', className: 'hold-empty', color: '#888888' },
  };

  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (phase === 'idle') {
        setPhase('inhale');
        setSecondsLeft(4);
      }

      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next phase
            setPhase((currPhase) => {
              if (currPhase === 'inhale') return 'hold';
              if (currPhase === 'hold') return 'exhale';
              if (currPhase === 'exhale') return 'hold-empty';
              return 'inhale'; // loops back
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, phase]);

  const toggleStart = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('idle');
      setSecondsLeft(4);
    } else {
      setIsActive(true);
    }
  };

  return (
    <div className="breathing-box-container" style={{ textAlign: 'center' }}>
      <h3>Box Breathing Guide</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '500px', margin: '0 auto' }}>
        Also known as four-square breathing. Clears the mind, calms the nervous system, and reduces physical tension.
      </p>

      <div className="breathing-circle-wrapper" style={{ margin: '1.5rem 0' }}>
        <div className="breathing-ring"></div>
        <div
          className={`breathing-circle ${phaseDetails[phase].className}`}
          style={{
            transition: phase === 'inhale' || phase === 'exhale' ? 'transform 4s linear' : 'none',
            backgroundColor: phaseDetails[phase].color
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {isActive ? secondsLeft : '•'}
          </div>
        </div>
      </div>

      <div className="breathing-instruction">
        {phaseDetails[phase].text}
      </div>

      <button className="btn btn-primary" onClick={toggleStart} style={{ marginTop: '1rem' }}>
        {isActive ? 'Pause Exercise' : 'Start Exercise'}
      </button>

      <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
        Source: NHS — Breathing Exercises for Stress Relief
      </div>
    </div>
  );
}

/* ==========================================
   5-4-3-2-1 GROUNDING COMPONENT
   ========================================== */
function GroundingTechnique() {
  const steps = [
    { num: 5, sense: 'SEE', prompt: 'Acknowledge 5 things you can see around you.', placeholder: 'e.g., A green plant, my water bottle...' },
    { num: 4, sense: 'TOUCH', prompt: 'Acknowledge 4 things you can feel or touch.', placeholder: 'e.g., The smooth fabric of my chair, my shoes...' },
    { num: 3, sense: 'HEAR', prompt: 'Acknowledge 3 things you can hear.', placeholder: 'e.g., Traffic hum, bird chirping, fan whirring...' },
    { num: 2, sense: 'SMELL', prompt: 'Acknowledge 2 things you can smell.', placeholder: 'e.g., Coffee brewing, paper, soap...' },
    { num: 1, sense: 'TASTE', prompt: 'Acknowledge 1 thing you can taste.', placeholder: 'e.g., Peppermint, clean water...' }
  ];

  const [inputs, setInputs] = useState({ 5: '', 4: '', 3: '', 2: '', 1: '' });

  const handleInputChange = (num, value) => {
    setInputs(prev => ({ ...prev, [num]: value }));
  };

  const handleClear = () => {
    setInputs({ 5: '', 4: '', 3: '', 2: '', 1: '' });
  };

  return (
    <div className="step-navigator">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h3>5-4-3-2-1 Sensory Grounding</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '500px', margin: '0 auto' }}>
          Engage your physical senses to anchor your mind to the present moment and interrupt racing thoughts.
        </p>
      </div>

      {steps.map((step) => (
        <div key={step.num} className={`step-card ${inputs[step.num] ? 'active' : ''}`}>
          <div className="step-num">{step.num} — {step.sense}</div>
          <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>{step.prompt}</p>
          <input
            type="text"
            className="chat-input"
            style={{ width: '100%', borderRadius: 'var(--border-radius-sm)', padding: '0.65rem 1rem' }}
            placeholder={step.placeholder}
            value={inputs[step.num]}
            onChange={(e) => handleInputChange(step.num, e.target.value)}
          />
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={handleClear}>Clear All</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
        Source: APA — Grounding Techniques for Anxiety relief
      </div>
    </div>
  );
}

/* ==========================================
   PMR COMPONENT
   ========================================== */
function PMRProgressive() {
  const pmrSteps = [
    { title: 'Feet & Toes', instruction: 'Curl your toes tightly. Squeeze the muscles in your feet. Hold for 5 seconds, then release. Feel the relaxation.', seconds: 5 },
    { title: 'Calves', instruction: 'Pull your toes upward toward your shins to tense your calf muscles. Hold for 5 seconds, then let go.', seconds: 5 },
    { title: 'Thighs & Glutes', instruction: 'Squeeze your thigh and buttock muscles tightly. Hold for 5 seconds. Feel the warm release as you relax.', seconds: 5 },
    { title: 'Abdomen', instruction: 'Tighten your stomach muscles like you are bracing. Hold for 5 seconds, then breathe out and relax completely.', seconds: 5 },
    { title: 'Shoulders & Neck', instruction: 'Shrug your shoulders up toward your ears. Hold for 5 seconds, then drop them completely down.', seconds: 5 },
    { title: 'Face & Jaw', instruction: 'Squeeze your eyes shut and scrunch your face. Clench your jaw gently. Hold for 5 seconds, then release.', seconds: 5 }
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [timerStatus, setTimerStatus] = useState('idle'); // idle, tensing, relaxing
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    let interval = null;
    if (timerStatus === 'tensing') {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setTimerStatus('relaxing');
            return 10; // 10 seconds of relaxation
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerStatus === 'relaxing') {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setTimerStatus('idle');
            // Advance to next step if not the last
            if (activeStep < pmrSteps.length - 1) {
              setActiveStep((s) => s + 1);
            }
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerStatus, activeStep]);

  const startStepTimer = () => {
    setTimerStatus('tensing');
    setSeconds(5);
  };

  const skipNext = () => {
    setTimerStatus('idle');
    setSeconds(5);
    if (activeStep < pmrSteps.length - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const skipPrev = () => {
    setTimerStatus('idle');
    setSeconds(5);
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Progressive Muscle Relaxation (PMR)</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
        Systematically tense and release muscle groups to notice and flush physical stress out of your body.
      </p>

      <div
        className="card-container"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '2rem',
          maxWidth: '500px',
          margin: '0 auto 1.5rem auto',
          borderStyle: 'dashed'
        }}
      >
        <div className="step-num">Step {activeStep + 1} of {pmrSteps.length}</div>
        <h4 style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>{pmrSteps[activeStep].title}</h4>
        <p style={{ fontSize: '0.95rem', margin: '1rem 0', minHeight: '4.5rem' }}>
          {pmrSteps[activeStep].instruction}
        </p>

        {timerStatus === 'idle' ? (
          <button className="btn btn-primary" onClick={startStepTimer}>
            Start Step Timer
          </button>
        ) : (
          <div
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              fontWeight: '600',
              backgroundColor: timerStatus === 'tensing' ? 'var(--crisis-light)' : 'var(--accent-light)',
              color: timerStatus === 'tensing' ? 'var(--crisis-color)' : 'var(--accent-color)'
            }}
          >
            {timerStatus === 'tensing' ? `Tense muscles (${seconds}s)...` : `Breathe & Relax (${seconds}s)...`}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={skipPrev} disabled={activeStep === 0}>
          Back
        </button>
        <button className="btn btn-secondary" onClick={skipNext} disabled={activeStep === pmrSteps.length - 1}>
          Next
        </button>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
        Source: NHS Clinical Guidelines — Progressive Muscle Relaxation
      </div>
    </div>
  );
}
