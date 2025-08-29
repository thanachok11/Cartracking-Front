import React, { useEffect, useState } from 'react';
import { fetchVehicle, fetchVehicleEvents, VehicleEvent } from '../api/components/MapApi';
import { statusTypes } from './map/constants/status';

// Small helpers
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
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

export default function ReportPage() {
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load list of vehicles/registrations
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
  if (regs.length) setSelected((prev) => prev || regs[0]);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load vehicles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // load events when selected changes
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // find vehicle id
        const found = vehicles.find((v: any) => {
          const reg = (v.registration || v.vehicle_id || '').toString().trim().toUpperCase().replace(/\s+/g, '');
          return reg && reg === selected.toString().trim().toUpperCase().replace(/\s+/g, '');
        });
        const extractDriverName = (v: any) => {
          if (!v) return null;
          // common shapes
          if (v.driver_name && typeof v.driver_name === 'object') return v.driver_name.name ?? null;
          if (v.driver_name && typeof v.driver_name === 'string') return v.driver_name;
          if (v.out_driver_name) return v.out_driver_name;
          if (v.driver && (v.driver.name || v.driver.driver_name)) return v.driver.name ?? v.driver.driver_name;
          return null;
        };
        setDriverName(extractDriverName(found));
        const vehicleId = (found && (found.vehicle_id || found.id)) || selected;

        // fetch events for today and previous day to cover cross-midnight
        const now = new Date();
        const today = isoDay(now);
        const prev = isoDay(new Date(now.getTime() - 4 * 3600 * 1000));

  const r1: any = await fetchVehicleEvents(String(vehicleId), today);
  const r2: any = await fetchVehicleEvents(String(vehicleId), prev);

  // events may be returned as an array or as an object with `.events` / `.data`
  const ev1: any[] = Array.isArray(r1) ? r1 : (r1?.events ?? r1?.data ?? []);
  const ev2: any[] = Array.isArray(r2) ? r2 : (r2?.events ?? r2?.data ?? []);
  const combined = ([] as any[]).concat(ev1 || [], ev2 || []);

  // timeline may also be present (daily summary with trip segments)
  const tl1: any[] = Array.isArray(r1?.timeline) ? r1.timeline : [];
  const tl2: any[] = Array.isArray(r2?.timeline) ? r2.timeline : [];
  const combinedTimeline = ([] as any[]).concat(tl1 || [], tl2 || []);

        // dedupe events by timestamp+coords
        const seen = new Set<string>();
        const merged: VehicleEvent[] = [];
        for (const e of combined) {
          const ts = (e.event_ts ?? e.date ?? '') as string;
          const lat = e.lat ?? e.latitude ?? e.coords?.lat ?? '';
          const lng = e.lng ?? e.longitude ?? e.coords?.lng ?? '';
          const key = `${ts}::${lat}::${lng}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(e as VehicleEvent);
          }
        }

        // sort ascending by timestamp
        merged.sort((a, b) => {
          const ta = new Date(a.date ?? a.event_ts ?? '').getTime();
          const tb = new Date(b.date ?? b.event_ts ?? '').getTime();
          return (ta || 0) - (tb || 0);
        });

        // sample events every 5 minutes (keep first then any event >=5min later)
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

        // dedupe timeline entries by start/end coords + statusClass to reduce repeated segments
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

        if (!cancelled) {
          // show events newest-first
          setEvents(sampled.slice().reverse());
          setTimeline(cleanedTimeline || []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected, vehicles]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Report — Events</h2>
      <div style={{ margin: '12px 0' }}>
        <label style={{ marginRight: 8 }}>ทะเบียนรถ</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {registrations.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <div style={{ display: 'inline-block', marginLeft: 16 }}>
          <button onClick={() => {
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
            downloadCSV(`${selected || 'timeline' }_timeline.csv`, rows);
          }}>ดาวน์โหลด Timeline CSV</button>

          <button style={{ marginLeft: 8 }} onClick={() => {
            const rows: string[][] = [];
        rows.push(['time','lat','lng','speed','status','driver','description']);
            for (const ev of events) {
              const lat = ev.lat ?? ev.latitude ?? ev.coords?.lat ?? '';
              const lng = ev.lng ?? ev.longitude ?? ev.coords?.lng ?? '';
              rows.push([
                escapeCsv(ev.date ?? ev.event_ts ?? ''),
                escapeCsv(lat),
                escapeCsv(lng),
                escapeCsv(ev.speed ?? ''),
                escapeCsv(translateStatus(ev.vehicleStatus ?? ev.status ?? '')),
                escapeCsv(driverName ?? ev.driver_name?.name ?? ev.driver_name ?? '-'),
                escapeCsv(getPlaceDescriptionFromEvent(ev)),
              ]);
            }
            downloadCSV(`${selected || 'events'}_events.csv`, rows);
          }}>ดาวน์โหลด Events CSV</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {timeline && timeline.length > 0 && (
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
              {timeline.map((t, i) => (
                <tr key={`${t.tripNumber ?? i}-${i}`}>
                  <td style={{ padding: 8 }}>{t.tripNumber ?? i + 1}</td>
                  <td style={{ padding: 8 }}>{t.trip_start_latitude && t.trip_start_longitude ? `${t.trip_start_latitude}, ${t.trip_start_longitude}` : (t.trip_start_valid_latitude && t.trip_start_valid_longitude ? `${t.trip_start_valid_latitude}, ${t.trip_start_valid_longitude}` : '-')}</td>
                  <td style={{ padding: 8 }}>{t.trip_end_latitude && t.trip_end_longitude ? `${t.trip_end_latitude}, ${t.trip_end_longitude}` : (t.trip_end_valid_latitude && t.trip_end_valid_longitude ? `${t.trip_end_valid_latitude}, ${t.trip_end_valid_longitude}` : '-')}</td>
                  <td style={{ padding: 8 }}>{translateStatus(t.statusClass ?? t.status ?? '-')}</td>
                  <td style={{ padding: 8 }}>{t.trip_start_address ?? t.trip_valid_start_address ?? '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h3>Events</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Lat,Lng</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Speed</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Driver</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Description / Address</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 12 }}>No events found</td></tr>
            )}
            {events.map((ev, i) => (
              <tr key={`${ev.event_ts ?? ev.date ?? i}-${i}`}>
                <td style={{ padding: 8 }}>{formatTs(ev.date ?? ev.event_ts)}</td>
                <td style={{ padding: 8 }}>{getLatLng(ev)}</td>
                <td style={{ padding: 8 }}>{ev.speed ?? '-'}</td>
                <td style={{ padding: 8 }}>{translateStatus(ev.vehicleStatus ?? ev.status ?? '-')}</td>
                <td style={{ padding: 8 }}>{driverName ?? ev.driver_name?.name ?? ev.driver_name ?? '-'}</td>
                <td style={{ padding: 8 }}>{getPlaceDescriptionFromEvent(ev)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
