import React, { useEffect, useState, useMemo, useRef } from 'react';
import '../styles/pages/ReportPage.css';
import { fetchVehicle, fetchVehicleEvents, fetchDrivers, VehicleEvent } from '../api/components/MapApi';
import { statusTypes } from './map/constants/status';

// Global abort controller factory (stable identity) for fetch cancellation
const useAbortController = () => {
  const abortRef = useRef<AbortController | null>(null);
  const get = React.useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    return abortRef.current;
  }, []);
  return get;
};

// Small helpers
// isoDay now returns a local YYYY-MM-DD string (avoid UTC-based toISOString offsets)
const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const formatTs = (s?: string) => {
  if (!s) return '-';
  const t = new Date(s);
  if (isNaN(t.getTime())) return String(s);
  return t.toLocaleString();
};
const getLatLng = (e: VehicleEvent) => {
  const lat = e.lat ?? e.latitude ?? e.coords?.lat ?? '';
  const lng = e.lng ?? e.longitude ?? e.coords?.lng ?? '';
  return lat || lng ? `${lat}, ${lng}` : '-';
};

const translateStatus = (s?: string) => {
  if (!s) return '-';
  const key = String(s).toLowerCase();
  const found = statusTypes.find((st) => st.key === key || st.key === key.toLowerCase());
  return found ? found.label : s;
};

const normalizeString = (s?: string) => {
  const raw = (s ?? '').toString();
  try {
    // decompose unicode chars and strip combining marks (diacritics)
    const decomposed = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    // replace any non-alphanumeric (keep spaces) with space
    return decomposed.replace(/[^0-9A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  } catch (e) {
    return raw.replace(/[^0-9A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }
};

const driverMatch = (a?: string, b?: string) => {
  const A = normalizeString(a);
  const B = normalizeString(b);
  if (!A || !B) return false;
  if (A === B) return true;
  // contains check
  if (A.includes(B) || B.includes(A)) return true;
  const aParts = A.split(/\s+/).filter(Boolean);
  const bParts = B.split(/\s+/).filter(Boolean);
  // all parts of B present in A (order-insensitive)
  if (bParts.length > 0 && bParts.every((p) => A.includes(p))) return true;
  // last-name/surname match
  if (aParts.length > 0 && bParts.length > 0) {
    const aLast = aParts[aParts.length - 1];
    const bLast = bParts[bParts.length - 1];
    if (aLast && bLast && aLast === bLast) return true;
  }
  return false;
};

const escapeCsv = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  // escape quotes
  const out = s.replace(/"/g, '""');
  // wrap if contains comma/newline/quote
  if (/[",\n\r]/.test(out)) return `"${out}"`;
  return out;
};

const getPlaceDescriptionFromEvent = (ev: any) => {
  if (!ev) return '';
  const parts: string[] = [];
  // common address fields
  if (ev.address) parts.push(String(ev.address));
  if (ev.location) parts.push(String(ev.location));
  if (ev.description) parts.push(String(ev.description));
  // position_description principal / alternatives
  const pd = ev.position_description ?? ev.positionDescription ?? ev.position_description;
  if (pd?.principal?.description) parts.push(String(pd.principal.description));
  // alternatives may have different keys used in API
  if (pd?.alternatives?.description_al) parts.push(String(pd.alternatives.description_al));
  if (pd?.alternatives?.description_alternative) parts.push(String(pd.alternatives.description_alternative));
  // driver notes or other human-readable fields
  if (ev.driver_notes) parts.push(String(ev.driver_notes));
  return parts.filter(Boolean).join(' / ');
};

const extractDriverNameFromVehicle = (v: any): string | null => {
  if (!v) return null;
  if (v.driver_name && typeof v.driver_name === 'object') return v.driver_name.name ?? null;
  if (v.driver_name && typeof v.driver_name === 'string') return v.driver_name;
  if (v.out_driver_name) return v.out_driver_name;
  if (v.driver && (v.driver.name || v.driver.driver_name)) return v.driver.name ?? v.driver.driver_name;
  return null;
};

const getEventDriverName = (ev: any, vehicleDriverName?: string | null) => {
  if (!ev) return vehicleDriverName ?? '';
  if (ev.driver_name && typeof ev.driver_name === 'object') return ev.driver_name.name ?? vehicleDriverName ?? '';
  if (ev.driver_name && typeof ev.driver_name === 'string') return ev.driver_name;
  if (ev.out_driver_name) return ev.out_driver_name;
  if (ev.driver && (ev.driver.name || ev.driver.driver_name)) return ev.driver.name ?? ev.driver.driver_name;
  return vehicleDriverName ?? '';
};

const downloadCSV = (filename: string, rows: string[][]) => {
  // Prepend UTF-8 BOM so Excel on Windows recognizes UTF-8 (fixes garbled Thai)
  const csvBody = rows.map((r) => r.join(',')).join('\r\n');
  const csv = '\uFEFF' + csvBody;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// make a filesystem-safe short name for filenames (allow Thai range U+0E00-0E7F)
const safeFileName = (s?: string) => {
  if (!s) return '';
  return String(s)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^0-9A-Za-z_\-\u0E00-\u0E7F]/g, '');
};

// return array of ISO day strings from start to end (inclusive). If only start provided, returns [start].
const datesInRange = (start?: string, end?: string) => {
  if (!start) return [];
    const parseToDate = (s?: string) => {
    if (!s) return null;
    const trimmed = s.trim();
    // accept YYYY-MM-DD directly and construct a local Date to avoid timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-').map((p) => parseInt(p, 10));
      const [y, m, d] = parts;
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      return new Date(y, (m || 1) - 1, d || 1);
    }
    // accept MM/DD/YYYY or M/D/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [m, d, y] = trimmed.split('/').map((x) => parseInt(x, 10));
      return new Date(y, (m || 1) - 1, d || 1);
    }
    // fallback to Date parser
    const t = new Date(trimmed);
    return isNaN(t.getTime()) ? null : t;
  };

  try {
    const sDate = parseToDate(start);
    if (!sDate) return [];
    const eDate = parseToDate(end) ?? sDate;
    let cur = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
    let last = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());
    // swap if reversed
    if (cur.getTime() > last.getTime()) {
      const tmp = cur; cur = last; last = tmp;
    }
    const out: string[] = [];
    while (cur.getTime() <= last.getTime()) {
      out.push(isoDay(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  } catch (e) {
    return [];
  }
};

const rangeSuffix = (start?: string, end?: string) => {
  if (!start && !end) return '';
  if (start && !end) return `_${start}`;
  if (!start && end) return `_${end}`;
  if (start === end) return `_${start}`;
  return `_${start}_to_${end}`;
};

export default function ReportPage() {
  const getAbortController = useAbortController();
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [prefetchedEvents, setPrefetchedEvents] = useState<Record<string, VehicleEvent[]>>({});
  const [prefetchedTimeline, setPrefetchedTimeline] = useState<Record<string, any[]>>({});
  const [driverName, setDriverName] = useState<string | null>(null);
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [driversList, setDriversList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // cache for on-demand fetches (no background prefetch)
  // prefetchedEvents / prefetchedTimeline will be populated on-demand
  const [viewMode, setViewMode] = useState<'events' | 'timeline'>('events');
  const [eventsPage, setEventsPage] = useState<number>(1);
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const PAGE_SIZE = 50;
  // concurrency and cache tuning
  const CHUNK_SIZE = 1; // reduce concurrent requests to backend (changed to 1 per request)
  const CACHE_TTL = 60 * 1000; // 60s TTL for cached recent per-vehicle results
  const [prefetchedAt, setPrefetchedAt] = useState<Record<string, number>>({});

  // debounce inputs: keep "pending" input values and apply after short delay
  const [pendingSelected, setPendingSelected] = useState<string>('');
  const [pendingFilterDriver, setPendingFilterDriver] = useState<string>('');
  const [pendingStartDate, setPendingStartDate] = useState<string>('');
  const [pendingEndDate, setPendingEndDate] = useState<string>('');
  const DEBOUNCE_MS = 300;

  // confirmation modal for large date-ranges
  const [showConfirmRangeModal, setShowConfirmRangeModal] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const handleDateInputChange = (which: 'start' | 'end', value: string) => {
    // compute prospective start/end using pending values when appropriate
    const curStart = pendingStartDate || reportStartDate;
    const curEnd = pendingEndDate || reportEndDate;
    const newStart = which === 'start' ? value : curStart;
    const newEnd = which === 'end' ? value : curEnd;

    // if both set, check range length
    if (newStart && newEnd) {
      const days = datesInRange(newStart, newEnd);
      if (days.length > 7) {
        // prompt user to confirm large range
        setPendingRange({ start: newStart, end: newEnd });
        setShowConfirmRangeModal(true);
        return;
      }
    }

    // otherwise apply to pending (debounce will commit to reportStartDate/reportEndDate)
    if (which === 'start') setPendingStartDate(value);
    else setPendingEndDate(value);
  };

  // apply pending inputs to actual selected/filter after debounce
  useEffect(() => {
    const id = setTimeout(() => { setSelected(pendingSelected); }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pendingSelected]);
  useEffect(() => {
    const id = setTimeout(() => { setFilterDriver(pendingFilterDriver); }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pendingFilterDriver]);
  useEffect(() => {
    const id = setTimeout(() => { setReportStartDate(pendingStartDate); }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pendingStartDate]);
  useEffect(() => {
    const id = setTimeout(() => { setReportEndDate(pendingEndDate); }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pendingEndDate]);

  const driverOptions = useMemo(() => {
    // gather driver names from API/vehicles/events but only keep full names (at least 2 words)
    const setNames = new Set<string>();
    const isFullName = (s?: string) => {
      if (!s) return false;
      const parts = String(s).trim().split(/\s+/).filter(Boolean);
      return parts.length >= 2;
    };
    for (const d of driversList) if (isFullName(d)) setNames.add(String(d).trim());
    for (const v of vehicles) {
      const n = extractDriverNameFromVehicle(v);
      if (n && isFullName(n)) setNames.add(n.trim());
    }
    for (const ev of events) {
      const n = getEventDriverName(ev, driverName);
      if (n && isFullName(n)) setNames.add(n.trim());
    }
    return Array.from(setNames).filter(Boolean).sort();
  }, [vehicles, events, driverName, driversList]);

  const driverMatchInfo = useMemo(() => {
    if (!filterDriver) return null;
    const want = normalizeString(filterDriver);
    const vehiclesMatch = vehicles.some((v) => driverMatch(extractDriverNameFromVehicle(v) ?? '', want));
    return { vehiclesMatch };
  }, [filterDriver, vehicles]);

  // keep the real fetch function in a ref to avoid changing identity when cache state updates
  const fetchFnRef = useRef<((vehicleId: string, dateRange?: string[], abortSignal?: AbortSignal) => Promise<{ events: VehicleEvent[]; timeline: any[] }>) | null>(null);

  if (!fetchFnRef.current) {
    fetchFnRef.current = async (vehicleId: string, dateRange?: string[], abortSignal?: AbortSignal) => {
      if (!vehicleId) return { events: [] as VehicleEvent[], timeline: [] as any[] };
      // if already cached and no explicit dateRange, return cache if fresh
      if ((!dateRange || dateRange.length === 0) && prefetchedEvents[vehicleId]) {
        const t = prefetchedAt[vehicleId] || 0;
        if (Date.now() - t < CACHE_TTL) {
          return { events: prefetchedEvents[vehicleId], timeline: prefetchedTimeline[vehicleId] || [] };
        }
      }

      const perDayEvents: any[] = [];
      const perDayTimeline: any[] = [];
      if (dateRange && dateRange.length > 0) {
        for (const d of dateRange) {
          if (abortSignal?.aborted) return { events: [], timeline: [] };
          const r: any = await fetchVehicleEvents(String(vehicleId), d).catch(() => null);
          const evs: any[] = Array.isArray(r) ? r : (r?.events ?? r?.data ?? []);
          const tl: any[] = Array.isArray(r?.timeline) ? r.timeline : [];
          perDayEvents.push(...(evs || []));
          perDayTimeline.push(...(tl || []));
        }
      } else {
        const now = new Date();
        const today = isoDay(now);
        const prev = isoDay(new Date(now.getTime() - 4 * 3600 * 1000));
        if (abortSignal?.aborted) return { events: [], timeline: [] };
        const r1: any = await fetchVehicleEvents(String(vehicleId), today).catch(() => null);
        if (abortSignal?.aborted) return { events: [], timeline: [] };
        const r2: any = await fetchVehicleEvents(String(vehicleId), prev).catch(() => null);
        const ev1: any[] = Array.isArray(r1) ? r1 : (r1?.events ?? r1?.data ?? []);
        const ev2: any[] = Array.isArray(r2) ? r2 : (r2?.events ?? r2?.data ?? []);
        const tl1: any[] = Array.isArray(r1?.timeline) ? r1.timeline : [];
        const tl2: any[] = Array.isArray(r2?.timeline) ? r2.timeline : [];
        perDayEvents.push(...(ev1 || []), ...(ev2 || []));
        perDayTimeline.push(...(tl1 || []), ...(tl2 || []));
      }

      // dedupe events by timestamp+coords
      const seen = new Set<string>();
      const merged: VehicleEvent[] = [];
      for (const e of perDayEvents) {
        const ts = (e.event_ts ?? e.date ?? '') as string;
        const lat = e.lat ?? e.latitude ?? e.coords?.lat ?? '';
        const lng = e.lng ?? e.longitude ?? e.coords?.lng ?? '';
        const key = `${ts}::${lat}::${lng}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(e as VehicleEvent);
        }
      }

      merged.sort((a, b) => {
        const ta = new Date(a.date ?? a.event_ts ?? '').getTime();
        const tb = new Date(b.date ?? b.event_ts ?? '').getTime();
        return (ta || 0) - (tb || 0);
      });

      const fiveMin = 5 * 60 * 1000;
      const sampled: VehicleEvent[] = [];
      let lastTs = 0;
      for (const ev of merged) {
        const t = new Date(ev.date ?? ev.event_ts ?? '').getTime() || 0;
        if (sampled.length === 0 || t - lastTs >= fiveMin) {
          sampled.push(ev);
          lastTs = t;
        }
      }

      // dedupe timeline entries by start/end coords + statusClass
      const timelineSeen = new Set<string>();
      const cleanedTimeline: any[] = [];
      for (const t of perDayTimeline || []) {
        const sLat = t.trip_start_valid_latitude ?? t.trip_start_latitude ?? '';
        const sLng = t.trip_start_valid_longitude ?? t.trip_start_longitude ?? '';
        const eLat = t.trip_end_valid_latitude ?? t.trip_end_latitude ?? '';
        const eLng = t.trip_end_valid_longitude ?? t.trip_end_longitude ?? '';
        const key = `${sLat}|${sLng}|${eLat}|${eLng}|${t.statusClass ?? ''}`;
        if (!timelineSeen.has(key)) {
          timelineSeen.add(key);
          cleanedTimeline.push(t);
        }
      }

      // cache only when no explicit dateRange (so cache represents recent days)
      if (!dateRange || dateRange.length === 0) {
        setPrefetchedEvents((prev) => ({ ...prev, [vehicleId]: sampled.slice().reverse() }));
        setPrefetchedTimeline((prev) => ({ ...prev, [vehicleId]: cleanedTimeline }));
        setPrefetchedAt((prev) => ({ ...prev, [vehicleId]: Date.now() }));
      }

      return { events: sampled.slice().reverse(), timeline: cleanedTimeline };
    };
  }

  // stable wrapper to call the ref-held function
  const fetchAndCacheVehicleEvents = React.useCallback(async (vehicleId: string, dateRange?: string[], abortSignal?: AbortSignal) => {
    return fetchFnRef.current ? fetchFnRef.current(vehicleId, dateRange, abortSignal) : { events: [], timeline: [] };
  }, []);

  // helper: find vehicle ids that correspond to a driver name
  const findVehicleIdsByDriver = React.useCallback(async (name: string) : Promise<string[]> => {
    const want = normalizeString(name);
    const ids: string[] = [];
    // first check vehicles array
    for (const v of vehicles) {
      const raw = extractDriverNameFromVehicle(v) ?? '';
      if (driverMatch(raw, want)) {
        const id = String(v.vehicle_id ?? v.id ?? v.registration ?? '');
        if (id) ids.push(id);
      }
    }
    return Array.from(new Set(ids));
  }, [vehicles]);

  const getRegistrationForVehicleId = React.useCallback((vid: string) => {
    const v = vehicles.find((x: any) => String(x.vehicle_id ?? x.id ?? x.registration ?? '') === String(vid));
    return (v && (v.registration || v.vehicle_id || v.id)) || vid;
  }, [vehicles]);

  // load drivers list once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await fetchDrivers();
        if (cancelled) return;
        // res may be array of driver objects or strings
        const list: string[] = Array.isArray(res) ? res.map((d: any) => (d.out_driver_name || d.name || d.driver_name || String(d))).filter(Boolean) : [];
        setDriversList(list);
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayedEvents = useMemo(() => {
    if (!filterDriver) return events;
    const want = filterDriver;
    return events.filter((ev) => {
      const evName = getEventDriverName(ev, driverName) || '';
      return driverMatch(evName, want);
    });
  }, [events, filterDriver, driverName]);

  // pagination helpers
  const eventsTotal = displayedEvents.length;
  const eventsTotalPages = Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (eventsPage - 1) * PAGE_SIZE;
    return displayedEvents.slice(start, start + PAGE_SIZE);
  }, [displayedEvents, eventsPage]);

  const timelineTotal = timeline.length;
  const timelineTotalPages = Math.max(1, Math.ceil(timelineTotal / PAGE_SIZE));
  const paginatedTimeline = useMemo(() => {
    const start = (timelinePage - 1) * PAGE_SIZE;
    return timeline.slice(start, start + PAGE_SIZE);
  }, [timeline, timelinePage]);

  // reset pages if data or filters change
  useEffect(() => { setEventsPage(1); }, [displayedEvents, filterDriver, selected, reportStartDate, reportEndDate]);
  useEffect(() => { setTimelinePage(1); }, [timeline, selected, filterDriver, reportStartDate, reportEndDate]);

  // load list of vehicles/registrations (run once on mount)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchVehicle();
        if (cancelled) return;
        const arr = Array.isArray(res) ? res : [];
        setVehicles(arr);
        const regs = arr.map((v: any) => (v.registration || v.vehicle_id || '').toString()).filter(Boolean);
        setRegistrations(regs);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load vehicles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // No background prefetch: events are fetched on-demand via fetchAndCacheVehicleEvents

  // load events when selected changes
  useEffect(() => {
    if (!selected) return;
    const abortController = getAbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // find vehicle id
        const found = vehicles.find((v: any) => {
          const reg = (v.registration || v.vehicle_id || '').toString().trim().toUpperCase().replace(/\s+/g, '');
          return reg && reg === selected.toString().trim().toUpperCase().replace(/\s+/g, '');
        });
        setDriverName(extractDriverNameFromVehicle(found));
        const vehicleId = (found && (found.vehicle_id || found.id)) || selected;
        const foundReg = (found && (found.registration || found.vehicle_id || found.id)) || selected;

        // fetch on-demand (use cache if available). fetchAndCacheVehicleEvents handles single-date or ranges.
        const dateRange = datesInRange(reportStartDate, reportEndDate);
        const { events: fEvents, timeline: fTimeline } = await fetchAndCacheVehicleEvents(String(vehicleId), dateRange.length > 0 ? dateRange : undefined, abortController.signal);
        if (!abortController.signal.aborted) {
          const withReg = fEvents.map((ev: any) => ({ ...ev, _vehicleId: vehicleId, _registration: foundReg }));
          setEvents(withReg);
          setTimeline(fTimeline || []);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) setError(err?.message ?? 'Failed to load events');
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    })();
    return () => { abortController.abort(); };
  }, [selected, vehicles, reportStartDate, reportEndDate, fetchAndCacheVehicleEvents, getAbortController]);

  // If user selects a driver (and no specific registration), load events for vehicles associated with that driver
  useEffect(() => {
    if (!filterDriver) return;
    if (selected) return; // prefer registration when selected
    const abortController = getAbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // find vehicle ids that match this driver name
        const matchedIds = await findVehicleIdsByDriver(filterDriver);

        // if no matched vehicles, clear
        if (matchedIds.length === 0) {
          if (!abortController.signal.aborted) {
            setEvents([]);
            setTimeline([]);
          }
          return;
        }

        const combinedEvents: any[] = [];
        const combinedTimeline: any[] = [];

        // fetch per vehicle using on-demand helper
        // process in controlled-concurrency chunks to limit backend load
        for (let i = 0; i < matchedIds.length; i += CHUNK_SIZE) {
          const chunk = matchedIds.slice(i, i + CHUNK_SIZE);
          await Promise.all(chunk.map(async (vehicleId) => {
            if (!vehicleId) return;
            const dateRange = datesInRange(reportStartDate, reportEndDate);
            const { events: fEventsForId, timeline: fTimelineForId } = await fetchAndCacheVehicleEvents(vehicleId, dateRange.length > 0 ? dateRange : undefined, abortController.signal);
            if (abortController.signal.aborted) return;
            const reg = getRegistrationForVehicleId(vehicleId);
            combinedEvents.push(...(fEventsForId || []).map((ev: any) => ({ ...ev, _vehicleId: vehicleId, _registration: reg })));
            combinedTimeline.push(...(fTimelineForId || []));
          }));
        }

        // dedupe & sample like above
        const seen = new Set<string>();
        const merged: VehicleEvent[] = [];
        for (const e of combinedEvents) {
          const ts = (e.event_ts ?? e.date ?? '') as string;
          const lat = e.lat ?? e.latitude ?? e.coords?.lat ?? '';
          const lng = e.lng ?? e.longitude ?? e.coords?.lng ?? '';
          const key = `${ts}::${lat}::${lng}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(e as VehicleEvent);
          }
        }

        merged.sort((a, b) => {
          const ta = new Date(a.date ?? a.event_ts ?? '').getTime();
          const tb = new Date(b.date ?? b.event_ts ?? '').getTime();
          return (ta || 0) - (tb || 0);
        });

        const fiveMin = 5 * 60 * 1000;
        const sampled: VehicleEvent[] = [];
        let lastTs = 0;
        for (const ev of merged) {
          const t = new Date(ev.date ?? ev.event_ts ?? '').getTime() || 0;
          if (sampled.length === 0 || t - lastTs >= fiveMin) {
            sampled.push(ev);
            lastTs = t;
          }
        }

        const timelineSeen = new Set<string>();
        const cleanedTimeline: any[] = [];
        for (const t of combinedTimeline || []) {
          const sLat = t.trip_start_valid_latitude ?? t.trip_start_latitude ?? '';
          const sLng = t.trip_start_valid_longitude ?? t.trip_start_longitude ?? '';
          const eLat = t.trip_end_valid_latitude ?? t.trip_end_latitude ?? '';
          const eLng = t.trip_end_valid_longitude ?? t.trip_end_longitude ?? '';
          const key = `${sLat}|${sLng}|${eLat}|${eLng}|${t.statusClass ?? ''}`;
          if (!timelineSeen.has(key)) {
            timelineSeen.add(key);
            cleanedTimeline.push(t);
          }
        }

        if (!abortController.signal.aborted) {
          setEvents(sampled.slice().reverse());
          setTimeline(cleanedTimeline || []);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) setError(err?.message ?? 'Failed to load events for driver');
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    })();
    return () => { abortController.abort(); };
  }, [filterDriver, selected, vehicles, findVehicleIdsByDriver, getRegistrationForVehicleId, reportStartDate, reportEndDate, fetchAndCacheVehicleEvents, getAbortController]);

  // If a date-range is selected and no specific registration or driver filter is set,
  // fetch events for all vehicles across the date range and show aggregated results.
  useEffect(() => {
    if (!reportStartDate && !reportEndDate) return;
    if (selected) return; // prefer single registration
    if (filterDriver) return; // prefer driver filter
    if (!vehicles || vehicles.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const dateRange = datesInRange(reportStartDate, reportEndDate);
        if (dateRange.length === 0) {
          // nothing to fetch
          if (!cancelled) {
            setEvents([]);
            setTimeline([]);
          }
          return;
        }

        const combinedEvents: any[] = [];
        const combinedTimeline: any[] = [];
        const chunkSize = CHUNK_SIZE;
        for (let i = 0; i < vehicles.length; i += chunkSize) {
          const chunk = vehicles.slice(i, i + chunkSize);
          await Promise.all(chunk.map(async (v: any) => {
            try {
              const vehicleId = String(v.vehicle_id ?? v.id ?? v.registration ?? '');
              if (!vehicleId) return;
              const reg = getRegistrationForVehicleId(vehicleId);
              // fetch each day in range for this vehicle
              for (const d of dateRange) {
                const r: any = await fetchVehicleEvents(vehicleId, d).catch(() => null);
                const evs: any[] = Array.isArray(r) ? r : (r?.events ?? r?.data ?? []);
                const tl: any[] = Array.isArray(r?.timeline) ? r.timeline : [];
                if (evs && evs.length) combinedEvents.push(...evs.map((ev: any) => ({ ...ev, _vehicleId: vehicleId, _registration: reg })));
                if (tl && tl.length) combinedTimeline.push(...tl);
              }
            } catch (e) {
              // ignore per-vehicle errors
            }
          }));
        }

        // dedupe events by timestamp+coords
        const seen = new Set<string>();
        const merged: VehicleEvent[] = [];
        for (const e of combinedEvents) {
          const ts = (e.event_ts ?? e.date ?? '') as string;
          const lat = e.lat ?? e.latitude ?? e.coords?.lat ?? '';
          const lng = e.lng ?? e.longitude ?? e.coords?.lng ?? '';
          const key = `${ts}::${lat}::${lng}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(e as VehicleEvent);
          }
        }

        merged.sort((a, b) => {
          const ta = new Date(a.date ?? a.event_ts ?? '').getTime();
          const tb = new Date(b.date ?? b.event_ts ?? '').getTime();
          return (ta || 0) - (tb || 0);
        });

        const tenMin = 10 * 60 * 1000;
        const sampled: VehicleEvent[] = [];
        let lastTs = 0;
        for (const ev of merged) {
          const t = new Date(ev.date ?? ev.event_ts ?? '').getTime() || 0;
          if (sampled.length === 0 || t - lastTs >= tenMin) {
            sampled.push(ev);
            lastTs = t;
          }
        }

        // dedupe timeline entries
        const timelineSeen = new Set<string>();
        const cleanedTimeline: any[] = [];
        for (const t of combinedTimeline || []) {
          const sLat = t.trip_start_valid_latitude ?? t.trip_start_latitude ?? '';
          const sLng = t.trip_start_valid_longitude ?? t.trip_start_latitude ?? '';
          const eLat = t.trip_end_valid_latitude ?? t.trip_end_latitude ?? '';
          const eLng = t.trip_end_valid_longitude ?? t.trip_end_longitude ?? '';
          const key = `${sLat}|${sLng}|${eLat}|${eLng}|${t.statusClass ?? ''}`;
          if (!timelineSeen.has(key)) {
            timelineSeen.add(key);
            cleanedTimeline.push(t);
          }
        }

        if (!cancelled) {
          setEvents(sampled.slice().reverse());
          setTimeline(cleanedTimeline || []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load events for date range');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reportStartDate, reportEndDate, selected, filterDriver, vehicles, getRegistrationForVehicleId]);

  return (
    <>
    <div className="dashboard-container">
      <h2>Report — Events</h2>
  <div className="dashboard-header">
    <div className="controls-row">
      <label>ทะเบียนรถ</label>
      <select value={pendingSelected} onChange={(e) => setPendingSelected(e.target.value)}>
        <option value='' disabled>-- เลือกทะเบียนรถ --</option>
        {registrations.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button className="btn btn-ghost" onClick={() => { setPendingSelected(''); setSelected(''); setEvents([]); setTimeline([]); }}>ล้าง</button>

      <label>Driver</label>
      <select value={pendingFilterDriver} onChange={(e) => setPendingFilterDriver(e.target.value)}>
        <option value='' disabled>-- เลือกคนขับ --</option>
        {driverOptions.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button className="btn btn-ghost" onClick={() => { setPendingFilterDriver(''); setFilterDriver(''); setEvents([]); setTimeline([]); }}>ล้าง</button>

      <label>วันที่เริ่ม</label>
      <input className="control-input" type="date" value={reportStartDate} onChange={(e) => handleDateInputChange('start', e.target.value)} />
      <label>วันที่สิ้นสุด</label>
      <input className="control-input" type="date" value={reportEndDate} onChange={(e) => handleDateInputChange('end', e.target.value)} />
      <button className="btn btn-ghost" onClick={() => { setPendingStartDate(''); setPendingEndDate(''); setReportStartDate(''); setReportEndDate(''); setEvents([]); setTimeline([]); }}>ล้าง วันที่</button>
    </div>
        <div className="header-actions report-actions">
          <button className="btn btn-primary" onClick={() => {
            // build timeline CSV
            const rows: string[][] = [];
            rows.push(['tripNumber','tripStartLat','tripStartLng','tripEndLat','tripEndLng','status','startAddress']);
            for (const t of timeline) {
              rows.push([
                escapeCsv(t.tripNumber ?? ''),
                escapeCsv(t.trip_start_valid_latitude ?? t.trip_start_latitude ?? ''),
                escapeCsv(t.trip_start_valid_longitude ?? t.trip_start_longitude ?? ''),
                escapeCsv(t.trip_end_valid_latitude ?? t.trip_end_latitude ?? ''),
                escapeCsv(t.trip_end_valid_longitude ?? t.trip_end_longitude ?? ''),
                escapeCsv(translateStatus(t.statusClass ?? t.status ?? '')),
                escapeCsv(t.trip_start_address ?? t.trip_valid_start_address ?? ''),
              ]);
            }
            const base = selected || filterDriver || 'timeline';
            const filenameBase = `${safeFileName(base)}${rangeSuffix(reportStartDate, reportEndDate)}`;
            downloadCSV(`${filenameBase}_timeline.csv`, rows);
          }}>ดาวน์โหลด Timeline CSV</button>

          <button className="btn btn-primary" onClick={() => {
            const rows: string[][] = [];
            rows.push(['time','lat','lng','speed','status','registration','driver','description']);
            for (const ev of displayedEvents) {
              const lat = ev.lat ?? ev.latitude ?? ev.coords?.lat ?? '';
              const lng = ev.lng ?? ev.longitude ?? ev.coords?.lng ?? '';
              rows.push([
                escapeCsv(ev.date ?? ev.event_ts ?? ''),
                escapeCsv(lat),
                escapeCsv(lng),
                escapeCsv(ev.speed ?? ''),
                escapeCsv(translateStatus(ev.vehicleStatus ?? ev.status ?? '')),
                escapeCsv(ev._registration ?? selected ?? ''),
                escapeCsv(getEventDriverName(ev, driverName) ?? ''),
                escapeCsv(getPlaceDescriptionFromEvent(ev)),
              ]);
            }
            const base = selected || filterDriver || 'events';
            const filenameBase = `${safeFileName(base)}${rangeSuffix(reportStartDate, reportEndDate)}`;
            downloadCSV(`${filenameBase}_events.csv`, rows);
          }}>ดาวน์โหลด Events CSV</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {driverMatchInfo && (
            <div style={{ marginTop: 6, fontSize: 13, color: vehicles.length === 0 ? '#666' : (driverMatchInfo.vehiclesMatch ? 'green' : 'red') }}>
              {driverMatchInfo.vehiclesMatch ? 'Found matching vehicle(s) by driver in vehicle list.' : 'No vehicles match this driver.'}
            </div>
          )}
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="toggle-group">
          <button
            className={`btn ${viewMode === 'events' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('events')}
            disabled={viewMode === 'events'}
          >Event</button>
          <button
            className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('timeline')}
            disabled={viewMode === 'timeline'}
          >Timeline</button>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>{viewMode === 'events' ? `Showing Events (${eventsTotal})` : `Showing Timeline (${timelineTotal})`}</div>
        </div>

        {viewMode === 'timeline' && (
          <div style={{ marginTop: 12 }}>
            <h3>Timeline</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Trip</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Start (lat,lng)</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>End (lat,lng)</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Address</th>
              </tr>
            </thead>
            <tbody>
                {paginatedTimeline.map((t, i) => (
                  <tr key={`${t.tripNumber ?? i}-${i}`}>
                    <td style={{ padding: 8 }}>{t.tripNumber ?? ((timelinePage - 1) * PAGE_SIZE) + i + 1}</td>
                    <td style={{ padding: 8 }}>{t.trip_start_latitude && t.trip_start_longitude ? `${t.trip_start_latitude}, ${t.trip_start_longitude}` : (t.trip_start_valid_latitude && t.trip_start_valid_longitude ? `${t.trip_start_valid_latitude}, ${t.trip_start_valid_longitude}` : '-')}</td>
                    <td style={{ padding: 8 }}>{t.trip_end_latitude && t.trip_end_longitude ? `${t.trip_end_latitude}, ${t.trip_end_longitude}` : (t.trip_end_valid_latitude && t.trip_end_valid_longitude ? `${t.trip_end_valid_latitude}, ${t.trip_end_valid_longitude}` : '-')}</td>
                    <td style={{ padding: 8 }}>{translateStatus(t.statusClass ?? t.status ?? '-')}</td>
                    <td style={{ padding: 8 }}>{t.trip_start_address ?? t.trip_valid_start_address ?? '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {timelineTotal > PAGE_SIZE && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setTimelinePage(Math.max(1, timelinePage - 1))} disabled={timelinePage <= 1}>Prev</button>
              <div>Page {timelinePage} / {timelineTotalPages}</div>
              <button onClick={() => setTimelinePage(Math.min(timelineTotalPages, timelinePage + 1))} disabled={timelinePage >= timelineTotalPages}>Next</button>
            </div>
          )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        {viewMode === 'events' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Lat,Lng</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Speed</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Registration</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Driver</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Description / Address</th>
            </tr>
          </thead>
            <tbody>
              {paginatedEvents.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 12 }}>No events found</td></tr>
              )}
              {paginatedEvents.map((ev, i) => (
                <tr key={`${ev.event_ts ?? ev.date ?? i}-${i}`}>
                  <td style={{ padding: 8 }}>{formatTs(ev.date ?? ev.event_ts)}</td>
                  <td style={{ padding: 8 }}>{getLatLng(ev)}</td>
                  <td style={{ padding: 8 }}>{ev.speed ?? '-'}</td>
                  <td style={{ padding: 8 }}>{translateStatus(ev.vehicleStatus ?? ev.status ?? '-')}</td>
                  <td style={{ padding: 8 }}>{ev._registration ?? selected ?? '-'}</td>
                  <td style={{ padding: 8 }}>{getEventDriverName(ev, driverName) ?? '-' }</td>
                  <td style={{ padding: 8 }}>{getPlaceDescriptionFromEvent(ev)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {eventsTotal > PAGE_SIZE && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setEventsPage(Math.max(1, eventsPage - 1))} disabled={eventsPage <= 1}>Prev</button>
              <div>Page {eventsPage} / {eventsTotalPages}</div>
              <button onClick={() => setEventsPage(Math.min(eventsTotalPages, eventsPage + 1))} disabled={eventsPage >= eventsTotalPages}>Next</button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  {/* Confirmation modal for large date ranges (>7 days) */}
  {showConfirmRangeModal && (
      <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 6, maxWidth: 600, width: '90%' }}>
          <h3>ยืนยันการดึงข้อมูลช่วงวันที่กว้าง</h3>
          <p>คุณกำลังเลือกช่วงวันที่ตั้งแต่ <strong>{pendingRange.start}</strong> ถึง <strong>{pendingRange.end}</strong> ซึ่งมีผลให้มีการส่งคำขอไปยังเซิร์ฟเวอร์เป็นจำนวนมาก ({datesInRange(pendingRange.start, pendingRange.end).length} วัน). โปรดยืนยันว่าต้องการดำเนินการต่อหรือไม่</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => {
              // cancel
              setShowConfirmRangeModal(false);
              setPendingRange({ start: '', end: '' });
            }}>ยกเลิก</button>
            <button onClick={() => {
              // apply pending range
              setReportStartDate(pendingRange.start);
              setReportEndDate(pendingRange.end);
              setShowConfirmRangeModal(false);
              setPendingRange({ start: '', end: '' });
            }}>ยืนยันและดำเนินการ</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
