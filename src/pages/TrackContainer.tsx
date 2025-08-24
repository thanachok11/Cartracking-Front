import React, { useEffect } from 'react';
import '../styles/pages/TrackContainer.css';

const TrackContainersPage: React.FC = () => {
    useEffect(() => {
        window.open("https://ucontainers.com.cn/login.php", "_blank");
    }, []);

    return null;
};

export default TrackContainersPage;
