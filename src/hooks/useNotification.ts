import { useState, useRef, useCallback } from 'react';

interface NotificationState {
    message: string;
    type: 'success' | 'error';
}

interface UseNotificationOptions {
    duration?: number;
    autoCloseModal?: boolean;
}

export const useNotification = (options: UseNotificationOptions = {}) => {
    const { duration = 2500 } = options;
    
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [progress, setProgress] = useState(0);
    const hoveringRef = useRef(false);
    const timerRef = useRef<NodeJS.Timer | null>(null);
    const startTimeRef = useRef<number>(0);
    const remainingTimeRef = useRef<number>(duration);

    const clearNotification = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setNotification(null);
        setProgress(0);
    }, []);

    const showNotification = useCallback((
        message: string, 
        type: 'success' | 'error', 
        options?: { autoCloseModal?: boolean; onClose?: () => void }
    ) => {
        setNotification({ message, type });
        setProgress(0);
        remainingTimeRef.current = duration;
        startTimeRef.current = Date.now();

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (!hoveringRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                const newProgress = (elapsed / remainingTimeRef.current) * 100;
                setProgress(newProgress);

                if (elapsed >= remainingTimeRef.current) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    setNotification(null);
                    setProgress(0);
                    
                    if (options?.autoCloseModal && options?.onClose) {
                        options.onClose();
                    }
                }
            } else {
                // ถ้า hover หยุด timer ชั่วคราว โดยไม่เพิ่ม progress
                startTimeRef.current = Date.now() - (progress / 100) * remainingTimeRef.current;
            }
        }, 20);
    }, [duration, progress]);

    const handleMouseEnter = useCallback(() => {
        hoveringRef.current = true;
    }, []);

    const handleMouseLeave = useCallback(() => {
        hoveringRef.current = false;
        startTimeRef.current = Date.now() - (progress / 100) * remainingTimeRef.current;
    }, [progress]);

    return {
        notification,
        progress,
        showNotification,
        clearNotification,
        handleMouseEnter,
        handleMouseLeave
    };
};