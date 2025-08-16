export function filterEventsLast4Hours<T extends { date?: string; event_ts?: string }>(
  events: T[]
): T[] {
  if (!events?.length) return [];
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return events
    .filter((e) => {
      const t = new Date((e as any).date || (e as any).event_ts);
      return t >= fourHoursAgo && t <= now;
    })
    .sort((a: any, b: any) => new Date(b.date || b.event_ts).getTime() - new Date(a.date || a.event_ts).getTime());
}

export function getPositionFromEvent(event: any): string {
  const lat = event.lat || event.coords?.lat || event.latitude;
  const lon = event.lng || event.coords?.lng || event.longitude;

  if (event.position_description?.principal?.description) return event.position_description.principal.description;
  if (event.address) return event.address;
  if (event.location) return event.location;
  if (event.description) return event.description;
  if (lat && lon) return `${lat}, ${lon}`;
  return 'ไม่มีข้อมูลตำแหน่ง';
}

export function convertFuelRawToLiters(rawValue: number) {
  return rawValue * 0.4;
}