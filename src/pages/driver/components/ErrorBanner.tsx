import React from 'react';

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-container">
      <div className="error-message">
        <h3>⚠️ การเชื่อมต่อมีปัญหา</h3>
        <p>{message}</p>
        <button className="retry-button" onClick={onRetry}>ลองใหม่อีกครั้ง</button>
      </div>
    </div>
  );
}