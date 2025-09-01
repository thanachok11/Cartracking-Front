import React, { useEffect, useState } from 'react';
import '../styles/pages/DataTodayPage.css';
import { fetchAllDataToday, createDataToday, updateDataToday, deleteDataToday, IDataTodayPayload } from '../api/components/dataTodayApi';
import { fetchAllDrivers } from '../api/components/driversApi';
import { fetchVehicle } from '../api/components/MapApi';
import { fetchAllContainers } from '../api/components/containersApi';

type DataToday = {
  _id?: string;
  datetime_in: string;
  driver_name: string;
  head_registration: string;
  tail_registration: string;
  container_no: string;
  station_in: string;
  companyname: string;
  createdAt?: string;
  updatedAt?: string;
};

const escapeCsv = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  const out = s.replace(/"/g, '""');
  if (/[",\n\r]/.test(out)) return `"${out}"`;
  return out;
};

const isoToDateOnly = (v?: string) => {
  if (!v) return '';
  if (typeof v !== 'string') return '';
  const t = v.split('T')[0];
  return t || v;
};

const ymdToDmy = (ymd?: string) => {
  if (!ymd) return '-';
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

const downloadCSV = (filename: string, rows: string[][]) => {
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

export default function DataTodayPage() {
  const [rows, setRows] = useState<DataToday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DataToday | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);
  const [containerNumbers, setContainerNumbers] = useState<string[]>([]);
  // filters
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterContainer, setFilterContainer] = useState<string>('');
  const [filterHeadReg, setFilterHeadReg] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>(''); // internal yyyy-mm-dd
  const [filterTo, setFilterTo] = useState<string>('');
  // display values in dd/mm/yyyy for the inputs
  const [filterFromDisplay, setFilterFromDisplay] = useState<string>('');
  const [filterToDisplay, setFilterToDisplay] = useState<string>('');
  // derive filtered rows
  const filteredRows = rows.filter((r) => {
    // driver filter
    if (filterDriver && (r.driver_name || '') !== filterDriver) return false;
  // head registration filter
  if (filterHeadReg && (r.head_registration || '') !== filterHeadReg) return false;
    // container filter
    if (filterContainer && (r.container_no || '') !== filterContainer) return false;
    // date filters: rows already normalized to yyyy-mm-dd, compare strings to avoid timezone issues
    if (filterFrom || filterTo) {
      const rYmd = (r.datetime_in || '').slice(0, 10);
      if (!rYmd) return false;
      const fromYmd = filterFrom || '';
      const toYmdStr = filterTo || filterFrom || '';
      if (fromYmd && rYmd < fromYmd) return false;
      if (toYmdStr && rYmd > toYmdStr) return false;
    }
    return true;
  });

  // form state
  const empty: DataToday = { datetime_in: '', driver_name: '', head_registration: '', tail_registration: '', container_no: '', station_in: '', companyname: '' };
  const [form, setForm] = useState<DataToday>(empty);
  const [datetimeInDisplay, setDatetimeInDisplay] = useState<string>(''); // dd-mm-yyyy shown in modal

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
  const data = await fetchAllDataToday();
  const arr = Array.isArray(data) ? data : [];
  // normalize datetime_in to date-only
  const normalized = arr.map((r: any) => ({ ...r, datetime_in: isoToDateOnly(r.datetime_in) }));
  setRows(normalized);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // fetch when filters change (debounced), abort inflight
  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;
  const q: any = {};
  if (filterDriver) q.driver_name = filterDriver;
  if (filterHeadReg) q.head_registration = filterHeadReg;
  if (filterContainer) q.container_no = filterContainer;
  // backend stores date-only (yyyy-mm-dd) so send date strings
  // backend stores date-only (yyyy-mm-dd) so send date strings
  if (filterFrom) q.from = filterFrom;
  if (filterTo) q.to = filterTo;
  // if only 'from' provided, treat it as single-day range
  if (filterFrom && !filterTo) q.to = filterFrom;

  const run = async () => {
      try {
        setLoading(true);
        setError(null);
    const data = await fetchAllDataToday(Object.keys(q).length ? q : undefined, ac.signal);
    if (!mounted) return;
    const arr = Array.isArray(data) ? data : [];
    const normalized = arr.map((r: any) => ({ ...r, datetime_in: isoToDateOnly(r.datetime_in) }));
    setRows(normalized);
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.message === 'canceled') return;
        setError(err?.message ?? 'Filter fetch failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const t = setTimeout(run, 300);
    return () => { mounted = false; ac.abort(); clearTimeout(t); };
  }, [filterDriver, filterHeadReg, filterContainer, filterFrom, filterTo]);

  // load drivers and vehicles for selects
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchAllDrivers();
        if (!cancelled) {
          const names = Array.isArray(d)
            ? d.map((x: any) => {
                const first = x.firstName || x.first_name || '';
                const last = x.lastName || x.last_name || '';
                const full = `${first} ${last}`.trim();
                return full || x.driver_name || x.name || '';
              }).filter(Boolean)
            : [];
          setDrivers(Array.from(new Set(names)));
        }
      } catch (err) {
        // ignore
      }

      try {
        const v = await fetchVehicle();
        if (!cancelled) {
          const regs = Array.isArray(v) ? v.map((x: any) => (x.registration || x.vehicle_id || '')).filter(Boolean) : [];
          setVehicleRegs(Array.from(new Set(regs)));
        }
      } catch (err) {
        // ignore
      }

      // load containers for container no. select
      try {
        const c = await fetchAllContainers();
        if (!cancelled) {
          const nums = Array.isArray(c) ? c.map((x: any) => x.containerNumber || x.container_no || x.number || '').filter(Boolean) : [];
          setContainerNumbers(Array.from(new Set(nums)));
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (k: keyof DataToday, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // prepare payload with allowed fields only (omit datetime_out and station_out)
      const payload = {
        datetime_in: form.datetime_in,
        driver_name: form.driver_name,
        head_registration: form.head_registration,
        tail_registration: form.tail_registration,
        container_no: form.container_no,
        station_in: form.station_in,
        companyname: form.companyname,
      };

      if (editing && editing._id) {
        await updateDataToday(editing._id, payload as Partial<IDataTodayPayload>);
      } else {
        await createDataToday(payload as IDataTodayPayload);
      }
  setForm(empty);
  setDatetimeInDisplay('');
  setEditing(null);
  setShowModal(false);
  await fetchAll();
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (r: DataToday) => {
    setEditing(r);
    setForm({ ...r });
    // prepare dd-mm-yyyy display for datetime_in if available
    if (r.datetime_in) {
      try {
        const d = new Date(r.datetime_in);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        setDatetimeInDisplay(`${dd}-${mm}-${yyyy}`);
      } catch (err) {
        setDatetimeInDisplay('');
      }
    } else {
      setDatetimeInDisplay('');
    }
    setShowModal(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    // use globalThis.confirm to avoid linter complaining about direct confirm usage
    if (!globalThis.confirm?.('ยืนยันการลบรายการนี้?')) return;
    try {
      setLoading(true);
  await deleteDataToday(id);
  await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
  const rowsOut: string[][] = [];
  rowsOut.push(['datetime_in','driver_name','head_registration','tail_registration','container_no','station_in','companyname']);
  for (const r of filteredRows) {
      rowsOut.push([
        escapeCsv(ymdToDmy(r.datetime_in)),
        escapeCsv(r.driver_name),
        escapeCsv(r.head_registration),
        escapeCsv(r.tail_registration),
        escapeCsv(r.container_no),
        escapeCsv(r.station_in),
        escapeCsv(r.companyname),
      ]);
    }
    downloadCSV(`data_today_${new Date().toISOString().slice(0,10)}.csv`, rowsOut);
  };

  return (
    <div className="data-today-container">
      <h2>เพิ่มงานและออกรายงาน</h2>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={exportCsv} disabled={filteredRows.length === 0}>ดาวน์โหลด CSV</button>
      </div>

      {loading && <div className="muted">Loading...</div>}
      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            คนขับ
            <select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)}>
              <option value="">ทุกคนขับ</option>
              {drivers.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            หมายเลขตู้
            <select value={filterContainer} onChange={(e) => setFilterContainer(e.target.value)}>
              <option value="">ทุกตู้</option>
              {containerNumbers.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ทะเบียนหัว
            <select value={filterHeadReg} onChange={(e) => setFilterHeadReg(e.target.value)}>
              <option value="">ทุกทะเบียน</option>
              {vehicleRegs.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            จากวันที่
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                value={filterFrom || ''}
                onChange={(e) => {
                  const iso = e.target.value; // yyyy-mm-dd
                  setFilterFrom(iso);
                  if (iso) {
                    const [y, mo, d] = iso.split('-');
                    setFilterFromDisplay(`${d}-${mo}-${y}`);
                  } else {
                    setFilterFromDisplay('');
                  }
                }}
              />
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ถึงวันที่
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                value={filterTo || ''}
                onChange={(e) => {
                  const iso = e.target.value;
                  setFilterTo(iso);
                }}
              />
            </div>
          </label>

          <button className="btn btn-ghost" onClick={() => { setFilterDriver(''); setFilterHeadReg(''); setFilterContainer(''); setFilterFrom(''); setFilterTo(''); setFilterFromDisplay(''); setFilterToDisplay(''); }}>ล้างตัวกรอง</button>

          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setShowModal(true); }}>เพิ่มรายการ</button>
        </div>
      </div>

      {/* Modal popup for create/edit */}
      {showModal && (
        <div className="data-modal-backdrop">
          <div className="data-modal">
            <h3>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="row">
                <label>วันที่เข้า</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={form.datetime_in || ''}
                    onChange={(e) => {
                      const iso = e.target.value; // yyyy-mm-dd
                      handleChange('datetime_in', iso);
                      if (iso) {
                        const [y, mo, d] = iso.split('-');
                        setDatetimeInDisplay(`${d}-${mo}-${y}`);
                      } else {
                        setDatetimeInDisplay('');
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <label>คนขับ</label>
                <select value={form.driver_name || ''} onChange={(e) => handleChange('driver_name', e.target.value)} required>
                  <option value="">-- เลือกคนขับ --</option>
                  {drivers.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="row">
                <label>ทะเบียนหัว</label>
                <select value={form.head_registration || ''} onChange={(e) => handleChange('head_registration', e.target.value)} required>
                  <option value="">-- เลือกทะเบียน --</option>
                  {vehicleRegs.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="row">
                <label>ทะเบียนหาง</label>
                <input value={form.tail_registration || ''} onChange={(e) => handleChange('tail_registration', e.target.value)} required />
              </div>
              <div className="row">
                <label>หมายเลขตู้</label>
                <select value={form.container_no || ''} onChange={(e) => handleChange('container_no', e.target.value)} required>
                  <option value="">-- เลือกคอนเทนเนอร์ --</option>
                  {containerNumbers.map((cn) => (
                    <option key={cn} value={cn}>{cn}</option>
                  ))}
                </select>
              </div>
              <div className="row">
                <label>สถานะ</label>
                <input value={form.station_in || ''} onChange={(e) => handleChange('station_in', e.target.value)} required />
              </div>
              <div className="row">
                <label>บริษัท</label>
                <input value={form.companyname || ''} onChange={(e) => handleChange('companyname', e.target.value)} required />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">{editing ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setEditing(null); setForm(empty); }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>เวลาเข้า</th>
              <th>คนขับ</th>
              <th>ทะเบียนหัว</th>
              <th>ทะเบียนหาง</th>
              <th>หมายเลขตู้</th>
              <th>สถานะ</th>
              <th>บริษัท</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r._id}>
                <td>{r.datetime_in ? ymdToDmy(r.datetime_in) : '-'}</td>
                <td>{r.driver_name}</td>
                <td>{r.head_registration}</td>
                <td>{r.tail_registration}</td>
                <td>{r.container_no}</td>
                <td>{r.station_in}</td>
                
                <td>{r.companyname}</td>
                <td className="actions-col">
                  <button className="btn btn-ghost" onClick={() => handleEdit(r)}>แก้ไข</button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(r._id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
