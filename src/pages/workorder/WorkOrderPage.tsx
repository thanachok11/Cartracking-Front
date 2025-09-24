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
import NotificationToast from "../../components/common/NotificationToast";
import { useNotification } from "../../hooks/useNotification";
import "../../styles/pages/WorkOrderPage.css";
import "../../styles/components/NotificationToast.css";

const WorkOrderPage: React.FC = () => {
    const [orders, setOrders] = useState<IWorkOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<IWorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<IWorkOrder | null>(null);

    const [searchNumber, setSearchNumber] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [filterTitle, setFilterTitle] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");

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
        } catch (err) {
            console.error("❌ Error loading work orders:", err);
        } finally {
            setLoading(false);
        }
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
            results = results.filter(
                (o) =>
                    new Date(o.issueDate) >= new Date(dateFrom) &&
                    new Date(o.issueDate) <= new Date(dateTo)
            );
            const dateRange = `${new Date(dateFrom).toLocaleDateString("th-TH")} - ${new Date(
                dateTo
            ).toLocaleDateString("th-TH")}`;
            title = title ? `${title} ช่วงเวลา: ${dateRange}` : `ช่วงเวลา: ${dateRange}`;
        } else if (dateFrom) {
            results = results.filter((o) => new Date(o.issueDate) >= new Date(dateFrom));
            const dateRange = `ตั้งแต่ ${new Date(dateFrom).toLocaleDateString("th-TH")}`;
            title = title ? `${title} ${dateRange}` : dateRange;
        } else if (dateTo) {
            results = results.filter((o) => new Date(o.issueDate) <= new Date(dateTo));
            const dateRange = `ถึง ${new Date(dateTo).toLocaleDateString("th-TH")}`;
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

    const handleCreate = () => {
        setEditingOrder(null);
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
        setShowModal(true);
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
        } catch (err) {
            console.error("❌ Error deleting work order:", err);
            showNotification("เกิดข้อผิดพลาดในการลบใบสั่งงาน ❌", "error");
        }
    };

    const handleSave = async () => {
        try {
            // ตรวจสอบข้อมูลก่อนสร้าง
            if (!editingOrder?._id) {
                // ตรวจสอบ work order number ซ้ำ
                const existingWorkOrder = orders.find(
                    (order) => order.workOrderNumber === form.workOrderNumber
                );
                if (existingWorkOrder) {
                    showNotification("เลขใบสั่งงานนี้มีอยู่แล้ว กรุณาใช้เลขอื่น ⚠️", "error");
                    return;
                }

                // ตรวจสอบว่า driver name ตรงกับที่มีใน dropdown หรือไม่
                if (!drivers.includes(form.driverName)) {
                    showNotification("ชื่อคนขับไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }

                // ตรวจสอบ head plate ตรงกับข้อมูลหรือไม่
                if (!truckHeadRegs.includes(form.headPlate)) {
                    showNotification("ทะเบียนหัวไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }

                // ตรวจสอบ tail plate ตรงกับข้อมูลหรือไม่
                if (!truckTailRegs.includes(form.tailPlate)) {
                    showNotification("ทะเบียนหางไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }

                // ตรวจสอบ container number ตรงกับข้อมูลหรือไม่
                if (!containerNumbers.includes(form.containerNumber)) {
                    showNotification("หมายเลขตู้ไม่ตรงกับข้อมูลในระบบ กรุณาเลือกจาก dropdown ⚠️", "error");
                    return;
                }
            }

            if (editingOrder?._id) {
                await updateWorkOrder(editingOrder._id, form);
                showNotification("แก้ไขใบสั่งงานสำเร็จ! ✅", "success");
            } else {
                await createWorkOrder(form);
                showNotification("สร้างใบสั่งงานสำเร็จ! ✅", "success");
            }
            setShowModal(false);
            await loadOrders();
        } catch (err) {
            console.error("❌ Error saving work order:", err);
            const action = editingOrder?._id ? "แก้ไข" : "สร้าง";
            showNotification(`เกิดข้อผิดพลาดในการ${action}ใบสั่งงาน ❌`, "error");
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
                            <span className="refresh-icon">🔄</span>
                            รีเฟรช
                        </button>
                        <button className="workorder-btn-primary" onClick={handleCreate}>
                            ➕ สร้างใบสั่งงานใหม่
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
                <div className="workorder-card-container">
                    {filteredOrders.map((o) => (
                        <div className="workorder-card" key={o._id}>
                            <h3>📝 ใบสั่งงาน: {o.workOrderNumber}</h3>
                            <p>📦 สินค้า: {o.product}</p>
                            <p>👨‍✈️ พนักงานขับ: {o.driverName}</p>
                            <p>📱 เบอร์โทรศัพท์: {o.driverPhone}</p>
                            <p>🚛 หัว: {o.headPlate} | หาง: {o.tailPlate}</p>
                            <p>📦 ตู้: {o.containerNumber}</p>
                            <p>🏢 บริษัท: {o.companyName}</p>
                            <p> 🗓 วันที่ออกใบสั่ง: {new Date(o.issueDate).toLocaleDateString("th-TH")}</p>
                            <p>
                                ✏️ แก้ไขเมื่อ:{" "}
                                {o.updatedAt
                                    ? new Date(o.updatedAt).toLocaleString("th-TH", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    }) + " น."
                                    : "-"}
                            </p>


                            <p>📝 รายละเอียด: {o.description || "-"}</p>
                            <div className="workorder-card-actions">
                                <button className="work-btn-edit" onClick={() => handleEdit(o)}>✏️ แก้ไข</button>
                                <button className="work-btn-delete" onClick={() => handleDelete(o._id)}>🗑️ ลบ</button>
                            </div>
                        </div>
                    ))}
                </div>
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
                    loadingDropdowns={loadingDropdowns} //  ส่งเข้า modal
                    onChange={(k, v) => setForm({ ...form, [k]: v })}
                    onSubmit={handleSave}
                    onCancel={() => setShowModal(false)}
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
