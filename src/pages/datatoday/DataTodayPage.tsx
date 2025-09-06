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

    // filter states
    const [filterDriver, setFilterDriver] = useState("");
    const [filterContainer, setFilterContainer] = useState("");
    const [filterHeadReg, setFilterHeadReg] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    // dropdown values
    const [drivers, setDrivers] = useState<string[]>([]);
    const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
    const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
    const [containerNumbers, setContainerNumbers] = useState<string[]>([]);

    // โหลดข้อมูล table และ dropdowns จาก API
    useEffect(() => {
        let cancelled = false;

        // โหลดข้อมูล table
        const loadData = async () => {
            try {
                const data = await fetchAllDataToday();
                console.log("Load table data :" ,data);

                if (!cancelled) setRows(data);
            } catch (err) {
                console.error("Load table data error:", err);
            }
        };

        // โหลด dropdown values จาก API
        const loadDropdowns = async () => {
            // คนขับ
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
                console.error("Load drivers error:", err);
            }

            // รถหัว/หาง
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
                }
            } catch (err) {
                console.error("Load trucks error:", err);
            }

            // ตู้
            try {
                const c = await fetchAllContainers();
                if (!cancelled) {
                    const nums = Array.isArray(c) ? c.map((x: any) => x.containerNumber || x.container_no || x.number || '').filter(Boolean) : [];
                    setContainerNumbers(Array.from(new Set(nums)));
                }
            } catch (err) {
                console.error("Load containers error:", err);
            }
        };

        loadData();
        loadDropdowns();

        return () => { cancelled = true; };
    }, []);

    // แปลงวันที่
    const ymdToDmy = (ymd?: string): string => {
        if (!ymd) return "";
        const d = new Date(ymd);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("th-TH");
    };

    const exportCsv = () => {
        if (!rows.length) return;

        const header = ["เวลาเข้า", "คนขับ", "ทะเบียนหัว", "ทะเบียนหาง", "หมายเลขตู้", "ตำแหน่ง", "บริษัท"];
        const csvContent = [
            header.join(","),
            ...rows.map(r => [
                ymdToDmy(r.datetime_in),
                r.driver_name,
                r.head_registration,
                r.tail_registration,
                r.container_no,
                r.station_in,
                r.companyname,
            ].join(","))
        ].join("\n");

        // เพิ่ม BOM ให้ Excel อ่านภาษาไทยได้
        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data_today.csv";
        a.click();
    };


    // ฟิลเตอร์ข้อมูลก่อนแสดง
    const filteredRows = rows.filter(r => {
        if (filterDriver && r.driver_name !== filterDriver) return false;
        if (filterContainer && r.container_no !== filterContainer) return false;
        if (filterHeadReg && r.head_registration !== filterHeadReg) return false;
        if (filterFrom && r.datetime_in && r.datetime_in < filterFrom) return false;
        if (filterTo && r.datetime_in && r.datetime_in > filterTo) return false;
        return true;
    });

    // ฟอร์มเปลี่ยนค่า
    const handleFormChange = (k: keyof DataToday, v: any) => {
        setForm(prev => ({ ...prev, [k]: v }));
    };

    // submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                datetime_in: form.datetime_in || "",
                driver_name: form.driver_name || "",
                head_registration: form.head_registration || "",
                tail_registration: form.tail_registration || "",
                container_no: form.container_no || "",
                station_in: form.station_in || "",
                companyname: form.companyname || "",
            };

            if (editing?._id) {
                await updateDataToday(editing._id, payload);
            } else {
                await createDataToday(payload);
            }

            // reload data after submit
            const data = await fetchAllDataToday();
            setRows(data);
            setShowModal(false);
            setForm({});
            setEditing(null);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (row: DataToday) => {
        setEditing(row);
        setForm(row);
        setShowModal(true);
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (window.confirm("คุณต้องการลบรายการนี้ใช่ไหม?")) {
            await deleteDataToday(id);
            const data = await fetchAllDataToday();
            setRows(data);
        }
    };

    const handleAddNew = () => {
        setForm({});
        setEditing(null);
        setShowModal(true);
    };

    const openOnMap = (station?: string) => {
        if (!station) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station)}`, "_blank");
    };

    return (
        <div className="page-container">
            {/* export + filter */}
            <ExportToolbar onExport={exportCsv} disabled={!rows.length} />
            <FilterToolbar
                drivers={drivers}
                truckHeadRegs={truckHeadRegs}
                containerNumbers={containerNumbers}
                filterDriver={filterDriver}
                filterContainer={filterContainer}
                filterHeadReg={filterHeadReg}
                filterFrom={filterFrom}
                filterTo={filterTo}
                onChange={{
                    driver: setFilterDriver,
                    container: setFilterContainer,
                    headReg: setFilterHeadReg,
                    from: setFilterFrom,
                    to: setFilterTo,
                    reset: () => {
                        setFilterDriver("");
                        setFilterContainer("");
                        setFilterHeadReg("");
                        setFilterFrom("");
                        setFilterTo("");
                    },
                    addNew: handleAddNew,
                }}
            />

            {/* ตารางข้อมูล */}
            <DataTable
                rows={filteredRows}
                onEdit={handleEdit}
                onDelete={handleDelete}
                openOnMap={openOnMap}
                ymdToDmy={ymdToDmy}
            />

            {/* modal ฟอร์ม */}
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
                onCancel={() => {
                    setShowModal(false);
                    setForm({});
                    setEditing(null);
                }}
            />
        </div>
    );
}
