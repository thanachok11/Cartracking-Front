import React from 'react';

interface NotificationToastProps {
    message?: string;
    type?: 'success' | 'error';
    progress?: number;
    isHovering?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
    message,
    type,
    progress = 0,
    isHovering = false,
    onMouseEnter,
    onMouseLeave
}) => {
    if (!message || !type) return null;

    return (
        <div
            className={`notification-toast ${type}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {message}
            <div
                className="notification-progress"
                style={{
                    width: `${progress}%`,
                    transition: isHovering ? "none" : "width 0.02s linear"
                }}
            />
        </div>
    );
};

export default NotificationToast;