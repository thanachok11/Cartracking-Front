export function Report_parseEventTimestamp(ev: any): number | null {
    const ts = ev?.event_ts ?? ev?.date;
    if (!ts) return null;
    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) return parsed;
    // try numeric
    const maybeNum = Number(ts);
    return Number.isFinite(maybeNum) ? maybeNum : null;
}

export function Report_filterEventsLast4Hours(events: any[]): any[] {
    if (!Array.isArray(events)) return [];
    const now = Date.now();
    const cutoff = now - 4 * 60 * 60 * 1000;
  const withTs = events
    .map((e) => ({ e, ts: Report_parseEventTimestamp(e) }))
        .filter((x) => x.ts && x.ts >= cutoff)
        .sort((a, b) => (b.ts as number) - (a.ts as number))
        .map((x) => x.e);
    return withTs;
}

export function Report_getPositionFromEvent(ev: any): string {
    if (!ev) return '';
    const pdesc = ev.position_description;
    const principal = pdesc?.principal?.description;
    if (principal) return principal;
    if (ev.address) return ev.address;
    if (ev.location) return ev.location;
    const lat = ev.lat ?? ev.latitude ?? ev.coords?.lat;
    const lng = ev.lng ?? ev.longitude ?? ev.coords?.lng;
    if ((lat || lat === 0) && (lng || lng === 0)) return `${lat}, ${lng}`;
    if (ev.description) return ev.description;
    return '';
}
export function convertFuelRawToLiters(rawValue: number) {
  return rawValue * 0.4;
}
