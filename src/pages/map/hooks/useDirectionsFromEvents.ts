import { useEffect, useState } from 'react';

export function useDirectionsFromEvents(
  events: any[],
  enabled: boolean
): google.maps.DirectionsResult | null {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!enabled || !events || events.length < 2) {
      setDirections(null);
      return;
    }

    const newest = events[0];
    const oldest = events[events.length - 1];

    const startLat = parseFloat(oldest.lat || oldest.coords?.lat || oldest.latitude);
    const startLng = parseFloat(oldest.lng || oldest.coords?.lng || oldest.longitude);
    const endLat = parseFloat(newest.lat || newest.coords?.lat || newest.latitude);
    const endLng = parseFloat(newest.lng || newest.coords?.lng || newest.longitude);

    if ([startLat, startLng, endLat, endLng].some((n) => isNaN(n))) return;
    if (Math.abs(startLat - endLat) < 0.0001 && Math.abs(startLng - endLng) < 0.0001) return;

    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: { lat: startLat, lng: startLng },
        destination: { lat: endLat, lng: endLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) setDirections(result!);
        else setDirections(null);
      }
    );
  }, [enabled, JSON.stringify(events.map((e) => [e.lat ?? e.coords?.lat ?? e.latitude, e.lng ?? e.coords?.lng ?? e.longitude]))]);

  return directions;
}