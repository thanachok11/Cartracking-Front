import React, { useEffect, useState } from "react";
import { DataToday } from "../../types/DataToday";
import {
    fetchAllDataToday,
    createDataToday,
    updateDataToday,
    deleteDataToday,
    IDataTodayPayload,
} from "../../api/components/dataTodayApi";
import { fetchAllDrivers } from "../../api/components/driversApi";
import { fetchTruckHeads, fetchTruckTails } from "../../api/components/truckApi";
import { fetchAllContainers } from "../../api/components/containersApi";
import { fetchWorkOrders } from "../../api/components/orderApi";
import ExportToolbar from "./components/ExportToolbar";
import FilterToolbar from "./components/FilterToolbar";
import DataTodayModal from "./components/DataTodayModal/DataTodayModal"; // ✅ ใช้ตัวใหม่
import DataTable from "./components/DataTable";
import NotificationToast from "../../components/common/NotificationToast";
import { useNotification } from "../../hooks/useNotification";
import "../../styles/pages/DataTodayPage.css";
import "./components/DataTodayModal/DataTodayModal.css"
import "../../styles/components/NotificationToast.css";
export default function DataTodayPage() {
    const [rows, setRows] = useState<DataToday[]>([]);
    const [form, setForm] = useState<Partial<DataToday>>({});
    const [editing, setEditing] = useState<Partial<DataToday> | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // notification hook
    const { 
        notification, 
        progress, 
        showNotification, 
        handleMouseEnter, 
        handleMouseLeave 
    } = useNotification();

    // preview state 👇
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // dropdown lists
    const [drivers, setDrivers] = useState<string[]>([]);
    const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
    const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
    const [containerNumbers, setContainerNumbers] = useState<string[]>([]);
    const [workOrderNumbers, setWorkOrderNumbers] = useState<string[]>([]);

    // filters
    const [filterDriver, setFilterDriver] = useState("");
    const [filterContainer, setFilterContainer] = useState("");
    const [filterHeadReg, setFilterHeadReg] = useState("");
    const [filterBooking, setFilterBooking] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await fetchAllDataToday();
                if (!cancelled) setRows(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("load data error", err);
            }
        };

        const loadLists = async () => {
            try {
                const d = await fetchAllDrivers();
                if (!cancelled && Array.isArray(d)) {
                    const names = d
                        .map((x: any) => {
                            const first = x.firstName || x.first_name || "";
                            const last = x.lastName || x.last_name || "";
                            return (
                                `${first} ${last}`.trim() ||
                                x.driver_name ||
                                x.name ||
                                ""
                            );
                        })
                        .filter(Boolean);
                    setDrivers(Array.from(new Set(names)));
                }
            } catch (e) {
                /* ignore */
            }

            try {
                const [heads, tails] = await Promise.all([
                    fetchTruckHeads(),
                    fetchTruckTails(),
                ]);
                if (!cancelled) {
                    setTruckHeadRegs(
                        Array.isArray(heads)
                            ? Array.from(
                                new Set(
                                    heads
                                        .map((h: any) => h.licensePlate || "")
                                        .filter(Boolean)
                                )
                            )
                            : []
                    );
                    setTruckTailRegs(
                        Array.isArray(tails)
                            ? Array.from(
                                new Set(
                                    tails
                                        .map((t: any) => t.licensePlate || "")
                                        .filter(Boolean)
                                )
                            )
                            : []
                    );
                }
            } catch (e) {
                /* ignore */
            }

            try {
                const c = await fetchAllContainers();
                if (!cancelled && Array.isArray(c))
                    setContainerNumbers(
                        Array.from(
                            new Set(
                                c.map(
                                    (x: any) =>
                                        x.containerNumber ||
                                        x.container_no ||
                                        x.number ||
                                        ""
                                ).filter(Boolean)
                            )
                        )
                    );
            } catch (e) {
                /* ignore */
            }

            try {
                const workOrders = await fetchWorkOrders();
                if (!cancelled && Array.isArray(workOrders)) {
                    const numbers = workOrders
                        .map((wo: any) => wo.workOrderNumber || "")
                        .filter(Boolean);
                    setWorkOrderNumbers(Array.from(new Set(numbers)));
                }
            } catch (e) {
                console.error("Error loading work orders:", e);
            }
        };

        load();
        loadLists();
        return () => {
            cancelled = true;
        };
    }, []);

    const isoToDateOnly = (v?: string) => (v ? String(v).slice(0, 10) : "");
    const ymdToDmy = (v?: string) => {
        if (!v) return "";
        const d = new Date(v);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString("th-TH");
    };

    // filtered rows -- using same logic as WorkOrder page
    const filteredRows = rows.filter((r) => {
        if (filterDriver && r.driver_name !== filterDriver) return false;
        if (filterContainer && r.container_no !== filterContainer) return false;
        if (filterHeadReg && r.head_registration !== filterHeadReg) return false;
        if (
            filterBooking &&
            !String((r as any).booking_id || "")
                .toLowerCase()
                .includes(filterBooking.toLowerCase())
        )
            return false;
        
        // Date filtering logic (same as WorkOrder)
        if (filterFrom && filterTo) {
            const rowDate = new Date(r.datetime_in);
            const fromDate = new Date(filterFrom);
            const toDate = new Date(filterTo);
            if (rowDate < fromDate || rowDate > toDate) return false;
        } else if (filterFrom) {
            const rowDate = new Date(r.datetime_in);
            const fromDate = new Date(filterFrom);
            if (rowDate < fromDate) return false;
        } else if (filterTo) {
            const rowDate = new Date(r.datetime_in);
            const toDate = new Date(filterTo);
            if (rowDate > toDate) return false;
        }
        
        return true;
    });

    const exportCsv = () => {
        if (!filteredRows.length) return;
        const header = [
            "รูปใบสั่งงาน",
            "เวลาเข้า",
            "คนขับ",
            "ทะเบียนหัว",
            "ทะเบียนหาง",
            "หมายเลขตู้",
            "ตำแหน่ง",
            "บริษัท",
            "เลขใบสั่งงาน",
        ];
        const out = [header.join(",")];
        for (const r of filteredRows) {
            out.push(
                [
                    `"${String((r as any).booking_id || "").replace(/"/g, '""')}"`,
                    `"${ymdToDmy(r.datetime_in)}"`,
                    `"${String(r.driver_name || "").replace(/"/g, '""')}"`,
                    `"${String(r.head_registration || "").replace(/"/g, '""')}"`,
                    `"${String(r.tail_registration || "").replace(/"/g, '""')}"`,
                    `"${String(r.container_no || "").replace(/"/g, '""')}"`,
                    `"${String(r.station_in || "").replace(/"/g, '""')}"`,
                    `"${String(r.companyname || "").replace(/"/g, '""')}"`,
                    `"${String((r as any).booking_image || "").replace(/"/g, '""')}"`,
                ].join(",")
            );
        }
        const csv = "\uFEFF" + out.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data_today_${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleFormChange = (k: keyof DataToday, v: any) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const bookingImage = (form as any).booking_image;
            const bookingId = (form as any).booking_id;
            
            console.log('🔍 Form data before submit:', form);
            console.log('🔍 Booking image:', bookingImage);
            console.log('🔍 Booking ID:', bookingId);
            
            // สร้าง FormData ตามตัวอย่างที่ให้มา
            const formData = new FormData();
            formData.append('datetime_in', form.datetime_in || '');
            formData.append('driver_name', form.driver_name || '');
            formData.append('head_registration', form.head_registration || '');
            formData.append('tail_registration', form.tail_registration || '');
            formData.append('container_no', form.container_no || '');
            formData.append('station_in', form.station_in || ''); // REQUIRED
            formData.append('companyname', form.companyname || ''); // REQUIRED
            
            // optional booking id
            if (bookingId) formData.append('booking_id', bookingId);
            
            // optional file
            if (bookingImage instanceof File) {
                formData.append('booking_image', bookingImage);
            } else if (typeof bookingImage === "string" && bookingImage) {
                // ถ้าเป็น string URL ให้ส่งเป็น string
                formData.append('booking_image', bookingImage);
            }
            
            console.log('🔍 FormData entries:');
            Array.from(formData.entries()).forEach(([key, value]) => {
                console.log(`  ${key}:`, value);
            });
            
            if (editing?._id) {
                await updateDataToday(editing._id as string, formData);
            } else {
                await createDataToday(formData);
            }
            
            console.log('✅ Data saved successfully, refreshing list...');
            const data = await fetchAllDataToday();
            setRows(Array.isArray(data) ? data : []);
            setShowModal(false);
            setForm({});
            setEditing(null);
            
            // Show success notification
            const action = editing?._id ? "แก้ไข" : "เพิ่ม";
            showNotification(`${action}รายการสำเร็จ! ✅`, "success");
        } catch (err: any) {
            console.error("❌ Save error:", err);
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);
            
            // แสดงข้อความข้อผิดพลาดให้ผู้ใช้
            const errorMessage = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            showNotification(`ไม่สามารถบันทึกข้อมูลได้: ${errorMessage} ❌`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    // preview handlers
    const openPreviewFromUrl = (url: string) => {
        setPreviewSrc(url);
        setPreviewVisible(true);
    };
    const openPreviewFromFile = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewSrc(url);
        setPreviewVisible(true);
    };
    const closePreview = () => {
        if (previewSrc && previewSrc.startsWith("blob:")) {
            URL.revokeObjectURL(previewSrc);
        }
        setPreviewSrc(null);
        setPreviewVisible(false);
    };

    const handleEdit = (r: DataToday) => {
        setEditing(r);
        setForm({
            ...r,
            datetime_in: r.datetime_in
                ? new Date(r.datetime_in).toISOString().split("T")[0]
                : "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (!window.confirm("คุณต้องการลบรายการนี้ใช่ไหม?")) return;
        try {
            await deleteDataToday(id);
            const d = await fetchAllDataToday();
            setRows(Array.isArray(d) ? d : []);
            showNotification("ลบรายการสำเร็จ! ✅", "success");
        } catch (e) {
            console.error(e);
            showNotification("เกิดข้อผิดพลาดในการลบข้อมูล ❌", "error");
        }
    };
    const handleAddNew = () => {
        setForm({});
        setEditing(null);
        setShowModal(true);
    };
    const openOnMap = (s?: string) => {
        if (!s) return;
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                s
            )}`,
            "_blank"
        );
    };

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

            <DataTable
                rows={filteredRows}
                onEdit={handleEdit}
                onDelete={handleDelete}
                openOnMap={openOnMap}
                ymdToDmy={ymdToDmy}
            />

            {/* ✅ ใช้ DataTodayModal ใหม่ */}
            <DataTodayModal
                show={showModal}
                editing={editing}
                form={form}
                drivers={drivers}
                truckHeadRegs={truckHeadRegs}
                truckTailRegs={truckTailRegs}
                containerNumbers={containerNumbers}
                workOrderNumbers={workOrderNumbers}
                submitting={submitting}
                previewSrc={previewSrc}
                previewVisible={previewVisible}
                openPreviewFromUrl={openPreviewFromUrl}
                openPreviewFromFile={openPreviewFromFile}
                closePreview={closePreview}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                onCancel={() => {
                    setShowModal(false);
                    setForm({});
                    setEditing(null);
                }}
            />

            {/* Notification Toast */}
            <NotificationToast
                message={notification?.message}
                type={notification?.type}
                progress={progress}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    );
}
