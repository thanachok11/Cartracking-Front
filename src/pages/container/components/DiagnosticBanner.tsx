import React from 'react';

export default function DiagnosticBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="error-container">
      <div className="error-message">
        <button className="dismiss-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
