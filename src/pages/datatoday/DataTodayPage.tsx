// DataTodayPage.tsx
import React, { useEffect, useState } from "react";
import { DataToday } from "../../types/DataToday";
import { fetchAllDataToday, createDataToday, updateDataToday, deleteDataToday } from "../../api/components/dataTodayApi";
import { fetchAllDrivers } from "../../api/components/driversApi";
import { fetchTruckHeads, fetchTruckTails } from "../../api/components/truckApi";
import { fetchAllContainers } from "../../api/components/containersApi";
import ExportToolbar from "./components/ExportToolbar";
import FilterToolbar from "./components/FilterToolbar";
import DataFormModal from "./components/DataFormModal";
import DataTable from "./components/DataTable";
import '../../styles/pages/DataTodayPage.css';

export default function DataTodayPage() {
    const [rows, setRows] = useState<DataToday[]>([]);
    const [form, setForm] = useState<Partial<DataToday>>({});
    const [editing, setEditing] = useState<Partial<DataToday> | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // filters
    const [filterDriver, setFilterDriver] = useState("");
    const [filterContainer, setFilterContainer] = useState("");
    const [filterHeadReg, setFilterHeadReg] = useState("");
    const [filterBooking, setFilterBooking] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    // dropdowns
    const [drivers, setDrivers] = useState<string[]>([]);
    const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
    const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
    const [containerNumbers, setContainerNumbers] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await fetchAllDataToday();
                if (!cancelled) setRows(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('load data error', err);
            }
        };

        const loadLists = async () => {
            try {
                const d = await fetchAllDrivers();
                if (!cancelled && Array.isArray(d)) {
                    const names = d.map((x: any) => {
                        const first = x.firstName || x.first_name || '';
                        const last = x.lastName || x.last_name || '';
                        return `${first} ${last}`.trim() || x.driver_name || x.name || '';
                    }).filter(Boolean);
                    setDrivers(Array.from(new Set(names)));
                }
            } catch (e) { /* ignore */ }

            try {
                const [heads, tails] = await Promise.all([fetchTruckHeads(), fetchTruckTails()]);
                if (!cancelled) {
                    setTruckHeadRegs(Array.isArray(heads) ? Array.from(new Set(heads.map((h:any)=>h.licensePlate||'').filter(Boolean))) : []);
                    setTruckTailRegs(Array.isArray(tails) ? Array.from(new Set(tails.map((t:any)=>t.licensePlate||'').filter(Boolean))) : []);
                }
            } catch (e) { /* ignore */ }

            try {
                const c = await fetchAllContainers();
                if (!cancelled && Array.isArray(c)) setContainerNumbers(Array.from(new Set(c.map((x:any)=>x.containerNumber||x.container_no||x.number||'').filter(Boolean))));
            } catch (e) { /* ignore */ }
        };

        load();
        loadLists();
        return () => { cancelled = true; };
    }, []);

    const isoToDateOnly = (v?: string) => (v ? String(v).slice(0,10) : '');
    const ymdToDmy = (v?: string) => { if(!v) return ''; const d=new Date(v); return isNaN(d.getTime())? '' : d.toLocaleDateString('th-TH'); };

    // filtered rows -- exact-day when only from set
    const filteredRows = rows.filter(r => {
        if (filterDriver && r.driver_name !== filterDriver) return false;
        if (filterContainer && r.container_no !== filterContainer) return false;
        if (filterHeadReg && r.head_registration !== filterHeadReg) return false;
    if (filterBooking && !(String((r as any).booking_id || '').toLowerCase().includes(filterBooking.toLowerCase()))) return false;
        const rowDate = isoToDateOnly(r.datetime_in);
        if (filterFrom && !filterTo) {
            if (!rowDate || rowDate !== filterFrom) return false;
        } else {
            if (filterFrom && (!rowDate || rowDate < filterFrom)) return false;
            if (filterTo && (!rowDate || rowDate > filterTo)) return false;
        }
        return true;
    });

    const exportCsv = () => {
        if (!filteredRows.length) return;
        const header = ["เวลาเข้า","คนขับ","ทะเบียนหัว","ทะเบียนหาง","หมายเลขตู้","ตำแหน่ง","บริษัท","Booking ID","Booking Image"];
        const out = [header.join(',')];
        for (const r of filteredRows) {
            out.push([
                `"${ymdToDmy(r.datetime_in)}"`,
                `"${String(r.driver_name||'').replace(/"/g,'""')}"`,
                `"${String(r.head_registration||'').replace(/"/g,'""')}"`,
                `"${String(r.tail_registration||'').replace(/"/g,'""')}"`,
                `"${String(r.container_no||'').replace(/"/g,'""')}"`,
                `"${String(r.station_in||'').replace(/"/g,'""')}"`,
                `"${String(r.companyname||'').replace(/"/g,'""')}"`,
                `"${String((r as any).booking_id||'').replace(/"/g,'""')}"`,
                `"${String((r as any).booking_image||'').replace(/"/g,'""')}"`,
            ].join(','));
        }
        const csv = '\uFEFF' + out.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `data_today_${new Date().toISOString().slice(0,10)}.csv`; a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    const handleFormChange = (k: keyof DataToday, v: any) => setForm(prev=>({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const bookingImage = (form as any).booking_image;
            const bookingId = (form as any).booking_id;
            const useFormData = bookingImage instanceof File;
            if (useFormData) {
                const fd = new FormData();
                fd.append('datetime_in', form.datetime_in || '');
                fd.append('driver_name', form.driver_name || '');
                fd.append('head_registration', form.head_registration || '');
                fd.append('tail_registration', form.tail_registration || '');
                fd.append('container_no', form.container_no || '');
                fd.append('station_in', form.station_in || '');
                fd.append('companyname', form.companyname || '');
                if (bookingId) fd.append('booking_id', bookingId);
                fd.append('booking_image', bookingImage as File);
                if (editing?._id) await updateDataToday(editing._id as string, fd as any);
                else await createDataToday(fd as any);
            } else {
                const payload: any = {
                    datetime_in: form.datetime_in || '',
                    driver_name: form.driver_name || '',
                    head_registration: form.head_registration || '',
                    tail_registration: form.tail_registration || '',
                    container_no: form.container_no || '',
                    station_in: form.station_in || '',
                    companyname: form.companyname || '',
                };
                if (bookingId) payload.booking_id = bookingId;
                if (typeof bookingImage === 'string') payload.booking_image = bookingImage;
                if (editing?._id) await updateDataToday(editing._id as string, payload as any);
                else await createDataToday(payload as any);
            }
            const data = await fetchAllDataToday(); setRows(Array.isArray(data)?data:[]);
            setShowModal(false); setForm({}); setEditing(null);
        } catch (err) {
            console.error('save error', err);
        } finally { setSubmitting(false); }
    };

    const handleEdit = (r: DataToday) => { setEditing(r); setForm(r); setShowModal(true); };
    const handleDelete = async (id?: string) => { if (!id) return; if (!window.confirm('คุณต้องการลบรายการนี้ใช่ไหม?')) return; try { await deleteDataToday(id); const d = await fetchAllDataToday(); setRows(Array.isArray(d)?d:[]); } catch(e){ console.error(e); } };
    const handleAddNew = () => { setForm({}); setEditing(null); setShowModal(true); };
    const openOnMap = (s?: string) => { if (!s) return; window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`,'_blank'); };

    return (
        <div className="page-container">
            <ExportToolbar onExport={exportCsv} disabled={!filteredRows.length} />
            <FilterToolbar
                drivers={drivers}
                truckHeadRegs={truckHeadRegs}
                containerNumbers={containerNumbers}
                filterDriver={filterDriver}
                filterContainer={filterContainer}
                filterHeadReg={filterHeadReg}
                filterBooking={filterBooking}
                filterFrom={filterFrom}
                filterTo={filterTo}
                onChange={{
                    driver: setFilterDriver,
                    container: setFilterContainer,
                    headReg: setFilterHeadReg,
                    booking: setFilterBooking,
                    from: setFilterFrom,
                    to: setFilterTo,
                    reset: () => { setFilterDriver(''); setFilterContainer(''); setFilterHeadReg(''); setFilterFrom(''); setFilterTo(''); },
                    addNew: handleAddNew,
                }}
            />

            <DataTable rows={filteredRows} onEdit={handleEdit} onDelete={handleDelete} openOnMap={openOnMap} ymdToDmy={ymdToDmy} />

            <DataFormModal
                show={showModal}
                editing={editing}
                form={form}
                drivers={drivers}
                truckHeadRegs={truckHeadRegs}
                truckTailRegs={truckTailRegs}
                containerNumbers={containerNumbers}
                submitting={submitting}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={() => { setShowModal(false); setForm({}); setEditing(null); }}
            />
        </div>
    );
}
