import React from 'react';

export default function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="error-container">
      <div className="error-message">
        <h3>⚠️ เกิดข้อผิดพลาด</h3>
        <p>{message}</p>
        <div className="error-actions">
          <button className="retry-button" onClick={onRetry}>🔄 ลองใหม่อีกครั้ง</button>
          <button className="dismiss-button" onClick={onDismiss}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
