import React, { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "../../i18n";

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
    const { t, lang } = useI18n();
    const locale = useMemo(() => (lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US'), [lang]);
    
    // สำหรับ description popup
    const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<string>("");

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
        // ไม่ใช้แล้ว - ใช้ popup แทน
    };

    // ฟังก์ชันสำหรับเปิด description popup
    const openDescriptionPopup = (description: string) => {
        setSelectedDescription(description);
        setShowDescriptionPopup(true);
    };

    // ฟังก์ชันสำหรับปิด description popup
    const closeDescriptionPopup = () => {
        setShowDescriptionPopup(false);
        setSelectedDescription("");
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
            // title used internally (not displayed); keep minimal
            title = `"${searchNumber}"`;
        }

        if (companyFilter) {
            results = results.filter((o) => o.companyName === companyFilter);
            title = title ? `${title} ${companyFilter}` : `${companyFilter}`;
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

            const dateRange = `${from.toLocaleDateString(locale)} - ${to.toLocaleDateString(locale)}`;
            title = title ? `${title} ${dateRange}` : `${dateRange}`;
        } else if (dateFrom) {
            const from = new Date(dateFrom);
            results = results.filter((o) => new Date(o.issueDate) >= from);
            const dateRange = `${from.toLocaleDateString(locale)}`;
            title = title ? `${title} ${dateRange}` : dateRange;
        } else if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999); // ✅ รวมทั้งวันสุดท้าย
            results = results.filter((o) => new Date(o.issueDate) <= to);
            const dateRange = `${to.toLocaleDateString(locale)}`;
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
        if (!window.confirm(t('workorder.confirmDelete'))) return;
        try {
            await deleteWorkOrder(id);
            await loadOrders();
            showNotification(t('common.delete') + " ✅", "success");
        } catch (err: any) {
            console.error("❌ Error deleting work order:", err);

            // ✅ ตรวจสอบ error ที่มาจาก backend (axios response)
            let errorMessage = t('workorder.confirmDelete');
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
                    showNotification(t('workorder.form.number') + " ⚠️", "error");
                    return;
                }
                if (!drivers.includes(form.driverName)) {
                    showNotification(t('drivers.noData.subtitle') + " ⚠️", "error");
                    return;
                }
                if (!truckHeadRegs.includes(form.headPlate)) {
                    showNotification(t('vehicles.noData.head') + " ⚠️", "error");
                    return;
                }
                if (!truckTailRegs.includes(form.tailPlate)) {
                    showNotification(t('vehicles.noData.tail') + " ⚠️", "error");
                    return;
                }
                if (!containerNumbers.includes(form.containerNumber)) {
                    showNotification(t('containers.noData.title') + " ⚠️", "error");
                    return;
                }
            }

            // ✅ แก้ไขหรือสร้างใหม่
            if (editingOrder?._id) {
                await updateWorkOrder(editingOrder._id, form);
                showNotification(t('common.save') + " ✅", "success");
            } else {
                await createWorkOrder(form);
                showNotification(t('workorder.createNew') + " ✅", "success");
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

            const action = editingOrder?._id ? t('common.edit') : t('common.add');
            let errorMessage = `${action} ❌`;

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
                        {t('workorder.title')}
                        <div className="result-count">
                            {filteredOrders.length > 0 || searchNumber || companyFilter || dateFrom || dateTo ? (
                                t('workorder.resultCount', { count: filteredOrders.length })
                            ) : (
                                t('workorder.totalCount', { count: orders.length })
                            )}
                        </div>
                    </h2>
                    <div className="header-actions">
                        <button className="refresh-workorder-button" onClick={() => loadOrders()}>
                            <span className="refresh-icon">
                                <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />

                            </span>
                            {t('common.refresh')}
                        </button>
                        <button className="workorder-btn-primary" onClick={handleCreate}>

                            <FontAwesomeIcon icon={faPlus} />
                            {t('workorder.createNew')}
                        </button>
                    </div>
                </div>

                <div className="workorder-header-bottom">
                    <input
                        type="text"
                        placeholder={t('workorder.searchPlaceholder')}
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('workorder.company.all')}</option>
                        <option value="ป๋อเฉิน">{t('workorder.form.header.porchoen')}</option>
                        <option value="บริษัทร่วม">{t('workorder.form.header.rotruam')}</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="date-input"
                        title={t('workorder.fromDate')}
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="date-input"
                        title={t('workorder.toDate')}
                    />
                </div>
            </div>

            {loading ? (
                <p className="workorder-loading">⏳ {t('common.loading')}</p>
            ) : filteredOrders.length === 0 && (searchNumber || companyFilter || dateFrom || dateTo) ? (
                <p className="workorder-no-data">⚠️ {t('workorder.noDataFiltered')}</p>
            ) : filteredOrders.length === 0 ? (
                <p className="workorder-no-data">⚠️ {t('workorder.noData')}</p>
            ) : (
                <table className="workorder-table">
                    <thead>
                        <tr>
                            <th>{t('workorder.table.issueDate')}</th>
                            <th>{t('workorder.table.number')}</th>
                            <th>{t('workorder.table.product')}</th>
                            <th>{t('workorder.table.driverName')}</th>
                            <th>{t('workorder.table.driverPhone')}</th>
                            <th>{t('workorder.table.headPlate')}</th>
                            <th>{t('workorder.table.tailPlate')}</th>
                            <th>{t('workorder.table.containerNumber')}</th>
                            <th>{t('workorder.table.companyName')}</th>
                            <th>{t('workorder.table.description')}</th>
                            <th>{t('workorder.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((o) => {
                            return (
                                <tr key={o._id}>
                                    <td>{new Date(o.issueDate).toLocaleDateString(locale)}</td>
                                    <td>{o.workOrderNumber}</td>
                                    <td>{o.product}</td>
                                    <td>{o.driverName}</td>
                                    <td>{o.driverPhone}</td>
                                    <td>{o.headPlate}</td>
                                    <td>{o.tailPlate}</td>
                                    <td>{o.containerNumber}</td>
                                    <td>{o.companyName}</td>
                                    <td className="description-cell">
                                        {o.description && o.description.length > 50 ? (
                                            <>
                                                <div className="desc-text">
                                                    {o.description.slice(0, 50) + "..."}
                                                </div>
                                                <button
                                                    className="toggle-desc-btn"
                                                    onClick={() => openDescriptionPopup(o.description || "")}
                                                >
                                                    {t('workorder.viewMore')}
                                                </button>
                                            </>
                                        ) : (
                                            o.description || "-"
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="work-btn-edit" onClick={() => handleEdit(o)}>{t('common.edit')}</button>
                                        <button className="work-btn-delete" onClick={() => handleDelete(o._id)}>{t('common.delete')}</button>
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

            {/* Description Popup */}
            {showDescriptionPopup && (
                <div className="description-popup-backdrop" onClick={closeDescriptionPopup}>
                    <div className="description-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="description-popup-header">
                            <h3>{t('workorder.description.title')}</h3>
                            <button className="description-popup-close" onClick={closeDescriptionPopup}>
                                ✖ {t('common.close')}
                            </button>
                        </div>
                        <div className="description-popup-content">
                            <p>{selectedDescription}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrderPage;
