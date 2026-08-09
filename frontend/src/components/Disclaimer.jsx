import React from 'react';

export default function Disclaimer({ onNavigate }) {
  return (
    <div className="disclaimer-banner">
      <div className="container-limit">
        <p>
          <strong>Notice:</strong> This assistant provides general mental-wellness information and coping exercises. 
          It is <strong>not a substitute for professional mental-health care or therapy.</strong>{' '}
          If you are in distress or experiencing a crisis, please seek immediate help. See{' '}
          <a
            onClick={() => onNavigate('chat')} 
            style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: '600' }}
          >
            crisis hotlines
          </a>{' '}
          or contact your local emergency services.
        </p>
      </div>
    </div>
  );
}
