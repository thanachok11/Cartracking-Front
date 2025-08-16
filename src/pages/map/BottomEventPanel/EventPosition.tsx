import React, { useEffect, useState } from 'react';
import { reverseGeocode } from '../../map/utils/geocode';
import { getPositionFromEvent } from '../../map/utils/events';

export default function EventPosition({ event, isLoaded }: { event: any; isLoaded: boolean }) {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const lat = event.lat || event.coords?.lat || event.latitude;
  const lng = event.lng || event.coords?.lng || event.longitude;
  const coordKey = lat && lng ? `${lat},${lng}` : '';

  useEffect(() => {
    const existing = getPositionFromEvent(event);
    if (existing !== 'ไม่มีข้อมูลตำแหน่ง' && !existing.includes(',')) {
      setAddress(existing);
      return;
    }
    if (lat && lng && isLoaded && !loading) {
      setLoading(true);
      reverseGeocode(Number(lat), Number(lng))
        .then((addr) => setAddress(addr))
        .catch(() => setAddress(existing))
        .finally(() => setLoading(false));
    } else {
      setAddress(existing);
    }
  }, [coordKey, isLoaded]);

  return <span>{loading ? 'กำลังค้นหาตำแหน่ง...' : address}</span>;
}