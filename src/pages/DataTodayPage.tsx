import React, { useEffect, useState } from 'react';
import '../styles/pages/DataTodayPage.css';
import { fetchAllDataToday, createDataToday, updateDataToday, deleteDataToday, IDataTodayPayload } from '../api/components/dataTodayApi';
import { fetchAllDrivers } from '../api/components/driversApi';
import { fetchTruckHeads, fetchTruckTails } from '../api/components/truckApi';
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
  const [submitting, setSubmitting] = useState(false);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
  const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]); // kept for backward compatibility
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
        const [truckHeads, truckTails] = await Promise.all([
          fetchTruckHeads(),
          fetchTruckTails()
        ]);
        if (!cancelled) {
          const headRegs = Array.isArray(truckHeads) ? truckHeads.map((x: any) => x.licensePlate || '').filter(Boolean) : [];
          const tailRegs = Array.isArray(truckTails) ? truckTails.map((x: any) => x.licensePlate || '').filter(Boolean) : [];
          setTruckHeadRegs(Array.from(new Set(headRegs)));
          setTruckTailRegs(Array.from(new Set(tailRegs)));
          // Keep vehicleRegs for filter compatibility
          const allRegs = [...headRegs, ...tailRegs];
          setVehicleRegs(Array.from(new Set(allRegs)));
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

  // Function สำหรับ format ทะเบียนรถ xxx-xxxx
  const formatLicensePlate = (value: string): string => {
    // ลบตัวอักษรที่ไม่ใช่ตัวอักษรและตัวเลข
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // จำกัดความยาวไม่เกิน 7 ตัวอักษร
    const limited = cleaned.slice(0, 7);
    
    // เพิ่ม dash หลังตัวอักษรที่ 3
    if (limited.length > 3) {
      return limited.slice(0, 3) + '-' + limited.slice(3);
    }
    return limited;
  };

  // Function สำหรับ format container number xxxx-xxxxxxx
  const formatContainerNumber = (value: string): string => {
    // ลบตัวอักษรที่ไม่ใช่ตัวอักษรและตัวเลข
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // จำกัดความยาวไม่เกิน 11 ตัวอักษร
    const limited = cleaned.slice(0, 11);
    
    // เพิ่ม dash หลังตัวอักษรที่ 4
    if (limited.length > 4) {
      return limited.slice(0, 4) + '-' + limited.slice(4);
    }
    return limited;
  };

  const handleHeadRegistrationChange = (value: string) => {
    const formatted = formatLicensePlate(value);
    handleChange('head_registration', formatted);
  };

  const handleTailRegistrationChange = (value: string) => {
    const formatted = formatLicensePlate(value);
    handleChange('tail_registration', formatted);
  };

  const handleContainerNumberChange = (value: string) => {
    const formatted = formatContainerNumber(value);
    handleChange('container_no', formatted);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // ป้องกันการส่งซ้ำ
    
    try {
      setSubmitting(true);
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
      setSubmitting(false); // คืนค่า disable ปุ่ม
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

  const openOnMap = (station?: string) => {
    if (!station) return;
    // expect formats like "lat,lng" or "lat lng" with optional spaces
    const m = String(station).trim().match(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/);
    if (!m) {
      // fallback: try to open search with the raw station string
      const q = encodeURIComponent(station);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
      return;
    }
    const lat = m[1];
    const lng = m[2];
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
    window.open(url, '_blank');
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
            <div>
              <input 
                list="filter-driver-list"
                value={filterDriver} 
                onChange={(e) => setFilterDriver(e.target.value)}
                placeholder="ทุกคนขับ"
                style={{ width: 150 }}
              />
              <datalist id="filter-driver-list">
                {drivers.map((d) => <option key={d} value={d} />)}
              </datalist>
              {filterDriver && !drivers.includes(filterDriver) && (
                <div style={{ color: 'orange', fontSize: '0.8em', position: 'absolute', zIndex: 10, background: 'white', padding: '2px', border: '1px solid orange', borderRadius: '2px' }}>
                  ไม่พบ "{filterDriver}"
                </div>
              )}
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            หมายเลขตู้
            <div>
              <input 
                list="filter-container-list"
                value={filterContainer} 
                onChange={(e) => setFilterContainer(e.target.value)}
                placeholder="ทุกตู้"
                style={{ width: 150 }}
              />
              <datalist id="filter-container-list">
                {containerNumbers.map((c) => <option key={c} value={c} />)}
              </datalist>
              {filterContainer && !containerNumbers.includes(filterContainer) && (
                <div style={{ color: 'orange', fontSize: '0.8em', position: 'absolute', zIndex: 10, background: 'white', padding: '2px', border: '1px solid orange', borderRadius: '2px' }}>
                  ไม่พบ "{filterContainer}"
                </div>
              )}
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ทะเบียนหัว
            <div>
              <input 
                list="filter-headreg-list"
                value={filterHeadReg} 
                onChange={(e) => setFilterHeadReg(e.target.value)}
                placeholder="ทุกทะเบียน"
                style={{ width: 150 }}
              />
              <datalist id="filter-headreg-list">
                {truckHeadRegs.map((r) => <option key={r} value={r} />)}
              </datalist>
              {filterHeadReg && !truckHeadRegs.includes(filterHeadReg) && (
                <div style={{ color: 'orange', fontSize: '0.8em', position: 'absolute', zIndex: 10, background: 'white', padding: '2px', border: '1px solid orange', borderRadius: '2px' }}>
                  ไม่พบทะเบียนหัว "{filterHeadReg}"
                </div>
              )}
            </div>
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
                <div>
                  <input 
                    list="driver-list"
                    value={form.driver_name || ''} 
                    onChange={(e) => handleChange('driver_name', e.target.value)} 
                    placeholder="-- เลือกหรือพิมพ์ชื่อคนขับ --"
                    required 
                  />
                  <datalist id="driver-list">
                    {drivers.map((d) => <option key={d} value={d} />)}
                  </datalist>
                  {form.driver_name && !drivers.includes(form.driver_name) && (
                    <div style={{ color: 'orange', fontSize: '0.9em', marginTop: '4px' }}>
                      ไม่พบข้อมูล "{form.driver_name}"
                    </div>
                  )}
                </div>
              </div>
              <div className="row">
                <label>ทะเบียนหัว</label>
                <div>
                  <input 
                    list="truck-head-list"
                    value={form.head_registration || ''} 
                    onChange={(e) => handleHeadRegistrationChange(e.target.value)} 
                    placeholder="-- เลือกหรือพิมพ์ทะเบียนหัว (xxx-xxxx) --"
                    maxLength={8}
                    required 
                  />
                  <datalist id="truck-head-list">
                    {truckHeadRegs.map((r) => <option key={r} value={r} />)}
                  </datalist>
                  {form.head_registration && !truckHeadRegs.includes(form.head_registration) && (
                    <div style={{ color: 'orange', fontSize: '0.9em', marginTop: '4px' }}>
                      ไม่พบข้อมูลทะเบียนหัว "{form.head_registration}"
                    </div>
                  )}
                </div>
              </div>
              <div className="row">
                <label>ทะเบียนหาง</label>
                <div>
                  <input 
                    list="truck-tail-list"
                    value={form.tail_registration || ''} 
                    onChange={(e) => handleTailRegistrationChange(e.target.value)} 
                    placeholder="-- เลือกหรือพิมพ์ทะเบียนหาง (xxx-xxxx) --"
                    maxLength={8}
                    required 
                  />
                  <datalist id="truck-tail-list">
                    {truckTailRegs.map((r) => <option key={r} value={r} />)}
                  </datalist>
                  {form.tail_registration && !truckTailRegs.includes(form.tail_registration) && (
                    <div style={{ color: 'orange', fontSize: '0.9em', marginTop: '4px' }}>
                      ไม่พบข้อมูลทะเบียนหาง "{form.tail_registration}"
                    </div>
                  )}
                </div>
              </div>
              <div className="row">
                <label>หมายเลขตู้</label>
                <div>
                  <input 
                    list="container-list"
                    value={form.container_no || ''} 
                    onChange={(e) => handleContainerNumberChange(e.target.value)} 
                    placeholder="-- เลือกหรือพิมพ์หมายเลขตู้ (xxxx-xxxxxxx) --"
                    maxLength={12}
                    required 
                  />
                  <datalist id="container-list">
                    {containerNumbers.map((cn) => <option key={cn} value={cn} />)}
                  </datalist>
                  {form.container_no && !containerNumbers.includes(form.container_no) && (
                    <div style={{ color: 'orange', fontSize: '0.9em', marginTop: '4px' }}>
                      ไม่พบข้อมูล "{form.container_no}"
                    </div>
                  )}
                </div>
              </div>
              <div className="row">
                <label>ตำแหน่ง</label>
                <input value={form.station_in || ''} onChange={(e) => handleChange('station_in', e.target.value)} required />
              </div>
              <div className="row">
                <label>บริษัท</label>
                <select value={form.companyname || ''} onChange={(e) => handleChange('companyname', e.target.value)} required>
                  <option value="">-- เลือกบริษัท --</option>
                  <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                  <option value="รถร่วม">รถร่วม</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : (editing ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ')}
                </button>
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
              <th>ตำแหน่ง</th>
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
                <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{r.station_in}</span>
                  <button className="btn btn-ghost" onClick={() => openOnMap(r.station_in)}>แผนที่</button>
                </td>

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
