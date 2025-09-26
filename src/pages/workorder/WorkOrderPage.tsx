import React, { useEffect, useState } from "react";
import {
    fetchWorkOrders,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
} from "../../api/components/orderApi";
import { fetchAllDrivers } from "../../api/components/driversApi";
import { fetchTruckHeads, fetchTruckTails } from "../../api/components/truckApi";
import { fetchAllContainers } from "../../api/components/containersApi";
import { IWorkOrder } from "../../types/WorkOrder";
import WorkOrderFormModal from "./WorkOrderFormModal";
import WorkOrderPrint from "./WorkOrderPrint";
import NotificationToast from "../../components/common/NotificationToast";
import { useNotification } from "../../hooks/useNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus } from "@fortawesome/free-solid-svg-icons";

import "../../styles/pages/WorkOrderPage.css";
import "../../styles/components/NotificationToast.css";

const WorkOrderPage: React.FC = () => {
    const [orders, setOrders] = useState<IWorkOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<IWorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<IWorkOrder | null>(null);

    const [hasInitializedForm, setHasInitializedForm] = useState(false);
    const [searchNumber, setSearchNumber] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [filterTitle, setFilterTitle] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    // เก็บสถานะ expand ของแต่ละ workOrder โดยใช้ id เป็น key
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

    //  form state
    const [form, setForm] = useState<IWorkOrder>({
        issueDate: "",
        workOrderNumber: "",
        product: "",
        driverName: "",
        driverPhone: "",
        headPlate: "",
        tailPlate: "",
        containerNumber: "",
        companyName: "",
        description: "",
    });

    //  dropdowns
    const [drivers, setDrivers] = useState<string[]>([]);
    const [driversPhone, setDriversPhone] = useState<string[]>([]);
    const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
    const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
    const [containerNumbers, setContainerNumbers] = useState<string[]>([]);

    // notification hook
    const {
        notification,
        progress,
        showNotification,
        handleMouseEnter,
        handleMouseLeave
    } = useNotification();

    // โหลด work orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchWorkOrders();
            setOrders(data);
            setFilteredOrders([]);
            setFilterTitle("");
            setForm({
                issueDate: "",
                workOrderNumber: "",
                product: "",
                driverName: "",
                driverPhone: "",
                headPlate: "",
                tailPlate: "",
                containerNumber: "",
                companyName: "",
                description: "",
            });
        } catch (err) {
            console.error("❌ Error loading work orders:", err);
        } finally {
            setLoading(false);
        }
    };
    const toggleDescription = (id: string) => {
        setExpandedRows((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // โหลด dropdowns
    const loadDropdowns = async () => {
        try {
            setLoadingDropdowns(true);
            console.log("📥 กำลังโหลด dropdown data...");

            const [driverData, headData, tailData, containerData] = await Promise.all([
                fetchAllDrivers(),
                fetchTruckHeads(),
                fetchTruckTails(),
                fetchAllContainers(),
            ]);

            console.log(" Drivers raw:", driverData);
            console.log(" Heads raw:", headData);
            console.log(" Tails raw:", tailData);
            console.log(" Containers raw:", containerData);

            // 🔹 driver: รองรับ firstName/lastName, driverName, name
            setDrivers(
                driverData
                    .map((d: any) => {
                        const first = d.firstName || d.first_name || "";
                        const last = d.lastName || d.last_name || "";
                        return `${first} ${last}`.trim() || d.driverName || d.driver_name || d.name || "";
                    })
                    .filter(Boolean)
            );

            // 🔹 head: รองรับ regNumber, plate, licensePlate
            setTruckHeadRegs(
                headData
                    .map((t: any) => t.regNumber || t.plate || t.licensePlate || "")
                    .filter(Boolean)
            );

            // 🔹 tail: รองรับ regNumber, plate, licensePlate
            setTruckTailRegs(
                tailData
                    .map((t: any) => t.regNumber || t.plate || t.licensePlate || "")
                    .filter(Boolean)
            );

            // 🔹 container: รองรับ containerNumber, container_no, number
            setContainerNumbers(
                containerData
                    .map((c: any) => c.containerNumber || c.container_no || c.number || "")
                    .filter(Boolean)
            );

            console.log("🎯 Dropdown state:", {
                drivers,
                truckHeadRegs,
                truckTailRegs,
                containerNumbers,
            });
        } catch (err) {
            console.error("❌ Error loading dropdown data:", err);
        } finally {
            setLoadingDropdowns(false);
        }
    };


    // 📌 โหลด work orders + dropdowns ทันทีตอนเข้า page
    useEffect(() => {
        loadOrders();

        loadDropdowns();
    }, []);

    // 📌 โหลด dropdowns ทุกครั้งที่เปิด modal (refresh ใหม่)
    useEffect(() => {
        if (showModal) {
            console.log("📥 เปิด modal → refresh dropdown data");
            loadDropdowns();
        }
    }, [showModal]);

    const applyFilter = () => {
        let results = [...orders];
        let title = "";

        if (searchNumber) {
            results = results.filter(
                (o) =>
                    o.workOrderNumber.toLowerCase().includes(searchNumber.toLowerCase()) ||
                    o.product.toLowerCase().includes(searchNumber.toLowerCase()) ||
                    o.driverName.toLowerCase().includes(searchNumber.toLowerCase()) ||
                    o.companyName.toLowerCase().includes(searchNumber.toLowerCase())
            );
            title = `ผลการค้นหา: "${searchNumber}"`;
        }

        if (companyFilter) {
            results = results.filter((o) => o.companyName === companyFilter);
            title = title ? `${title} บริษัท: ${companyFilter}` : `บริษัท: ${companyFilter}`;
        }

        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999); // ✅ รวมทั้งวันสุดท้าย

            results = results.filter(
                (o) =>
                    new Date(o.issueDate) >= from &&
                    new Date(o.issueDate) <= to
            );

            const dateRange = `${from.toLocaleDateString("th-TH")} - ${to.toLocaleDateString("th-TH")}`;
            title = title ? `${title} ช่วงเวลา: ${dateRange}` : `ช่วงเวลา: ${dateRange}`;
        } else if (dateFrom) {
            const from = new Date(dateFrom);
            results = results.filter((o) => new Date(o.issueDate) >= from);
            const dateRange = `ตั้งแต่ ${from.toLocaleDateString("th-TH")}`;
            title = title ? `${title} ${dateRange}` : dateRange;
        } else if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999); // ✅ รวมทั้งวันสุดท้าย
            results = results.filter((o) => new Date(o.issueDate) <= to);
            const dateRange = `ถึง ${to.toLocaleDateString("th-TH")}`;
            title = title ? `${title} ${dateRange}` : dateRange;
        }


        if (!searchNumber && !dateFrom && !dateTo && !companyFilter) {
            setFilteredOrders([]);
            setFilterTitle("");
        } else {
            setFilteredOrders(results);
            setFilterTitle(title || "ผลการกรอง");
        }
    };

    useEffect(() => {
        applyFilter();
    }, [searchNumber, dateFrom, dateTo, companyFilter, orders]);

    // กดปุ่มสร้างใหม่ → reset form เสมอ
    const handleCreate = () => {
        setEditingOrder(null);

        // 👉 reset form เฉพาะตอนที่ยังไม่เคย init
        if (!hasInitializedForm) {
            setForm({
                issueDate: "",
                workOrderNumber: "",
                product: "",
                driverName: "",
                driverPhone: "",
                headPlate: "",
                tailPlate: "",
                containerNumber: "",
                companyName: "",
                description: "",
            });
            setHasInitializedForm(true); // mark ว่าเคย init แล้ว
        }

        setShowModal(true);
    };

    // ✅ ปิด modal เฉย ๆ → ไม่ reset form
    const handleCancel = () => {
        setShowModal(false);
    };


    const handleEdit = (order: IWorkOrder) => {
        setEditingOrder(order);

        setForm({
            ...order,
            issueDate: order.issueDate
                ? new Date(order.issueDate).toISOString().split("T")[0]
                : "",
        });

        setShowModal(true);
    };


    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบใบสั่งงานนี้?")) return;
        try {
            await deleteWorkOrder(id);
            await loadOrders();
            showNotification("ลบใบสั่งงานสำเร็จ! ✅", "success");
        } catch (err: any) {
            console.error("❌ Error deleting work order:", err);

            // ✅ ตรวจสอบ error ที่มาจาก backend (axios response)
            let errorMessage = "เกิดข้อผิดพลาดในการลบใบสั่งงาน ❌";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            showNotification(errorMessage, "error");
        }
    };


    const handleSave = async () => {
        try {
            // ✅ ตรวจสอบข้อมูลก่อนสร้างใหม่
            if (!editingOrder?._id) {
                const existingWorkOrder = orders.find(
                    (order) => order.workOrderNumber === form.workOrderNumber
                );
                if (existingWorkOrder) {
                    showNotification("เลขใบสั่งงานนี้มีอยู่แล้ว กรุณาใช้เลขอื่น ⚠️", "error");
                    return;
                }
                if (!drivers.includes(form.driverName)) {
                    showNotification("ชื่อคนขับไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }
                if (!truckHeadRegs.includes(form.headPlate)) {
                    showNotification("ทะเบียนหัวไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }
                if (!truckTailRegs.includes(form.tailPlate)) {
                    showNotification("ทะเบียนหางไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }
                if (!containerNumbers.includes(form.containerNumber)) {
                    showNotification("หมายเลขตู้ไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }
            }

            // ✅ แก้ไขหรือสร้างใหม่
            if (editingOrder?._id) {
                await updateWorkOrder(editingOrder._id, form);
                showNotification("แก้ไขใบสั่งงานสำเร็จ! ✅", "success");
            } else {
                await createWorkOrder(form);
                showNotification("สร้างใบสั่งงานสำเร็จ! ✅", "success");
                // 👉 reset form หลังสร้างเสร็จ (แต่ไม่ reset ถ้าเป็นการแก้ไข)
                setForm({
                    issueDate: "",
                    workOrderNumber: "",
                    product: "",
                    driverName: "",
                    driverPhone: "",
                    headPlate: "",
                    tailPlate: "",
                    containerNumber: "",
                    companyName: "",
                    description: "",
                });
            }

            // ✅ ปิด modal แต่ form จะไม่ถูก reset ถ้าเป็นการแก้ไข/ยกเลิก
            setShowModal(false);

            // ✅ refresh ตารางแยกออกมา (delay นิดนึงเพื่อให้ backend update เสร็จ)
            setTimeout(() => {
                loadOrders();
            }, 300);
        } catch (err: any) {
            console.error("❌ Error saving work order:", err);

            const action = editingOrder?._id ? "แก้ไข" : "สร้าง";
            let errorMessage = `เกิดข้อผิดพลาดในการ${action}ใบสั่งงาน ❌`;

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            showNotification(errorMessage, "error");
        }
    };


    return (
        <div className="workorder-page">
            {/* Header กับ Search Bar รวมกัน */}
            <div className="workorder-header">
                <div className="workorder-header-top">
                    <h2 className="page-title">
                        ใบสั่งงาน
                        <div className="result-count">
                            {filteredOrders.length > 0 || searchNumber || companyFilter || dateFrom || dateTo ? (
                                `แสดง ${filteredOrders.length} รายการ`
                            ) : (
                                `ทั้งหมด ${orders.length} รายการ`
                            )}
                        </div>
                    </h2>
                    <div className="header-actions">
                        <button className="refresh-workorder-button" onClick={() => loadOrders()}>
                            <span className="refresh-icon">
                                <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />

                            </span>
                            รีเฟรช
                        </button>
                        <button className="workorder-btn-primary" onClick={handleCreate}>

                            <FontAwesomeIcon icon={faPlus} />
                            สร้างใบสั่งงานใหม่
                        </button>
                    </div>
                </div>

                <div className="workorder-header-bottom">
                    <input
                        type="text"
                        placeholder="เลขใบสั่งงาน / สินค้า / บริษัท / คนขับ"
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">ทั้งหมด</option>
                        <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                        <option value="รถร่วม">รถร่วม</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="date-input"
                        title="จากวันที่"
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="date-input"
                        title="ถึงวันที่"
                    />
                </div>
            </div>

            {loading ? (
                <p className="workorder-loading">⏳ กำลังโหลด...</p>
            ) : filteredOrders.length === 0 && (searchNumber || companyFilter || dateFrom || dateTo) ? (
                <p className="workorder-no-data">⚠️ ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
            ) : filteredOrders.length === 0 ? (
                <p className="workorder-no-data">⚠️ กรุณาใส่เลขที่ใบสั่งงาน หรือช่วงเวลาเพื่อค้นหา</p>
            ) : (
                <table className="workorder-table">
                    <thead>
                        <tr>
                            <th>เลขใบสั่งงาน</th>
                            <th>สินค้า</th>
                            <th>พนักงานขับ</th>
                            <th>เบอร์โทร</th>
                            <th>ทะเบียนหัว</th>
                            <th>ทะเบียนหาง</th>
                            <th>หมายเลขตู้</th>
                            <th>บริษัท</th>
                            <th>วันที่ออกใบสั่ง</th>
                            <th>แก้ไขล่าสุด</th>
                            <th>รายละเอียด</th>
                            <th>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((o) => {
                            const isExpanded = expandedRows[o._id || ""] || false;

                            return (
                                <tr key={o._id}>
                                    <td>{o.workOrderNumber}</td>
                                    <td>{o.product}</td>
                                    <td>{o.driverName}</td>
                                    <td>{o.driverPhone}</td>
                                    <td>{o.headPlate}</td>
                                    <td>{o.tailPlate}</td>
                                    <td>{o.containerNumber}</td>
                                    <td>{o.companyName}</td>
                                    <td>{new Date(o.issueDate).toLocaleDateString("th-TH")}</td>
                                    <td>
                                        {o.updatedAt
                                            ? new Date(o.updatedAt).toLocaleString("th-TH", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })
                                            : "-"}
                                    </td>
                                    <td
                                        className={`description-cell ${isExpanded ? "expanded" : ""}`}
                                    >
                                        {o.description && o.description.length > 50 ? (
                                            <>
                                                <div className="desc-text">
                                                    {isExpanded ? o.description : o.description.slice(0, 50) + "..."}
                                                </div>
                                                <button
                                                    className="toggle-desc-btn"
                                                    onClick={() => toggleDescription(o._id || "")}
                                                >
                                                    {isExpanded ? "ย่อ" : "เพิ่มเติม"}
                                                </button>
                                            </>
                                        ) : (
                                            o.description || "-"
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="work-btn-edit" onClick={() => handleEdit(o)}>แก้ไข</button>
                                        <button className="work-btn-delete" onClick={() => handleDelete(o._id)}>ลบ</button>
                                        <WorkOrderPrint order={o} />
                                    </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

            )}

            {showModal && (
                <WorkOrderFormModal
                    show={showModal}
                    editing={editingOrder}
                    form={form}
                    drivers={drivers}
                    driversPhone={driversPhone}
                    truckHeadRegs={truckHeadRegs}
                    truckTailRegs={truckTailRegs}
                    containerNumbers={containerNumbers}
                    submitting={loading}
                    loadingDropdowns={loadingDropdowns}
                    onChange={(k, v) => setForm({ ...form, [k]: v })}
                    onSubmit={handleSave}
                    onCancel={handleCancel}   // ใช้ handleCancel ที่ไม่ reset form
                />
            )}

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
};

export default WorkOrderPage;
