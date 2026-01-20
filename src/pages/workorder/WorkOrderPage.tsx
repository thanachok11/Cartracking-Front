import React, { useEffect, useMemo, useState } from "react";
import {
    fetchWorkOrders,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    importWorkOrders
} from "../../api/components/orderApi";
import { fetchAllDrivers } from "../../api/components/driversApi";
import { fetchTruckHeads, fetchTruckTails } from "../../api/components/truckApi";
import { fetchAllContainers } from "../../api/components/containersApi";
import { IWorkOrder } from "../../types/WorkOrder";

import WorkOrderFormModal from "./WorkOrderFormModal";
import WorkOrderHeader from "./WorkOrderHeader";
import WorkOrderTable from "./WorkOrderTable";
import WorkOrderImportModal from "./WorkOrderImportModal";

import DescriptionPopup from "./DescriptionPopup";
import NotificationToast from "../../components/common/NotificationToast";
import { useNotification } from "../../hooks/useNotification";
import { useI18n } from "../../i18n";

import "../../styles/pages/WorkOrderPage.css";
import "../../styles/pages/WorkOrderImportModal.css";
import "../../styles/components/NotificationToast.css";

const WorkOrderPage: React.FC = () => {
    const [orders, setOrders] = useState<IWorkOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<IWorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<IWorkOrder | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const [hasInitializedForm, setHasInitializedForm] = useState(false);
    const [searchNumber, setSearchNumber] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [, setFilterTitle] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");

    const { t, lang } = useI18n();
    const locale = useMemo(
        () => (lang === "th" ? "th-TH" : lang === "zh" ? "zh-CN" : "en-US"),
        [lang]
    );

    // popup
    const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<string>("");

    // form state
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

    // dropdowns
    const [drivers, setDrivers] = useState<string[]>([]);
    const [driversPhone] = useState<string[]>([]);
    const [truckHeadRegs, setTruckHeadRegs] = useState<string[]>([]);
    const [truckTailRegs, setTruckTailRegs] = useState<string[]>([]);
    const [containerNumbers, setContainerNumbers] = useState<string[]>([]);

    // notification
    const {
        notification,
        progress,
        showNotification,
        handleMouseEnter,
        handleMouseLeave,
    } = useNotification();

    // โหลด work orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchWorkOrders();
            setOrders(data);
            setFilteredOrders([]);
            setFilterTitle("");
            resetForm();
        } catch (err) {
            console.error("❌ Error loading work orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
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
    };

    // popup handler
    const openDescriptionPopup = (desc: string) => {
        setSelectedDescription(desc);
        setShowDescriptionPopup(true);
    };
    const closeDescriptionPopup = () => {
        setShowDescriptionPopup(false);
        setSelectedDescription("");
    };

    // โหลด dropdowns
    const loadDropdowns = async () => {
        try {
            setLoadingDropdowns(true);
            const [driverData, headData, tailData, containerData] =
                await Promise.all([
                    fetchAllDrivers(),
                    fetchTruckHeads(),
                    fetchTruckTails(),
                    fetchAllContainers(),
                ]);

            setDrivers(
                driverData
                    .map((d: any) => {
                        const first = d.firstName || d.first_name || "";
                        const last = d.lastName || d.last_name || "";
                        return (
                            `${first} ${last}`.trim() ||
                            d.driverName ||
                            d.driver_name ||
                            d.name ||
                            ""
                        );
                    })
                    .filter(Boolean)
            );

            setTruckHeadRegs(
                headData
                    .map((t: any) => t.regNumber || t.plate || t.licensePlate || "")
                    .filter(Boolean)
            );

            setTruckTailRegs(
                tailData
                    .map((t: any) => t.regNumber || t.plate || t.licensePlate || "")
                    .filter(Boolean)
            );

            setContainerNumbers(
                containerData
                    .map((c: any) => c.containerNumber || c.container_no || c.number || "")
                    .filter(Boolean)
            );
        } catch (err) {
            console.error("❌ Error loading dropdown data:", err);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    useEffect(() => {
        loadOrders();
        loadDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (showModal) {
            loadDropdowns();
        }
    }, [showModal]);

    // filter
    const applyFilter = () => {
        let results = [...orders];
        let title = "";

        if (searchNumber) {
            results = results.filter(
                (o) =>
                    o.workOrderNumber
                        .toLowerCase()
                        .includes(searchNumber.toLowerCase()) ||
                    o.product.toLowerCase().includes(searchNumber.toLowerCase()) ||
                    o.driverName.toLowerCase().includes(searchNumber.toLowerCase()) ||
                    o.companyName.toLowerCase().includes(searchNumber.toLowerCase())
            );
            title = `"${searchNumber}"`;
        }

        if (companyFilter) {
            results = results.filter((o) => o.companyName === companyFilter);
            title = title ? `${title} ${companyFilter}` : `${companyFilter}`;
        }

        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);

            results = results.filter(
                (o) => new Date(o.issueDate) >= from && new Date(o.issueDate) <= to
            );

            const dateRange = `${from.toLocaleDateString(locale)} - ${to.toLocaleDateString(
                locale
            )}`;
            title = title ? `${title} ${dateRange}` : `${dateRange}`;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchNumber, dateFrom, dateTo, companyFilter, orders]);

    // create
    const handleCreate = () => {
        setEditingOrder(null);
        if (!hasInitializedForm) {
            resetForm();
            setHasInitializedForm(true);
        }
        setShowModal(true);
    };

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
        if (!window.confirm(t("workorder.confirmDelete"))) return;
        try {
            await deleteWorkOrder(id);
            await loadOrders();
            showNotification(t("common.delete") + " ✅", "success");
        } catch (err: any) {
            let errorMessage = t("workorder.confirmDelete");
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
            if (editingOrder?._id) {
                await updateWorkOrder(editingOrder._id, form);
                showNotification(t("common.save") + " ✅", "success");
            } else {
                await createWorkOrder(form);
                showNotification(t("workorder.createNew") + " ✅", "success");
                resetForm();
            }
            setShowModal(false);
            setTimeout(() => {
                loadOrders();
            }, 300);
        } catch (err: any) {
            const action = editingOrder?._id ? t("common.edit") : t("common.add");
            let errorMessage = `${action} ❌`;
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            showNotification(errorMessage, "error");
        }
    };
    const handleConfirmImport = async (rows: any[]) => {
        try {
            const res = await importWorkOrders(rows);
            showNotification(`${res.message} (${res.count} rows)`, "success");
            loadOrders();
        } catch (err: any) {
            let errorMessage = err.response?.data?.message || err.message;
            showNotification("❌ Import Error: " + errorMessage, "error");
        }
    };

    return (
        <div className="workorder-page">
            <WorkOrderHeader
                searchNumber={searchNumber}
                setSearchNumber={setSearchNumber}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                onRefresh={loadOrders}
                onCreate={handleCreate}
                totalCount={orders.length}
                filteredCount={filteredOrders.length}
                onOpenImport={() => setShowImportModal(true)}   // ✅ ใช้ modal แทน
            />


            {loading ? (
                <p className="workorder-loading">⏳ {t("common.loading")}</p>
            ) : filteredOrders.length === 0 &&
                (searchNumber || companyFilter || dateFrom || dateTo) ? (
                <p className="workorder-no-data">⚠️ {t("workorder.noDataFiltered")}</p>
            ) : filteredOrders.length === 0 ? (
                <p className="workorder-no-data">⚠️ {t("workorder.noData")}</p>
            ) : (
                <WorkOrderTable
                    orders={filteredOrders}
                    locale={locale}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDescription={openDescriptionPopup}
                />
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
                    onCancel={handleCancel}
                />
            )}

            <NotificationToast
                message={notification?.message}
                type={notification?.type}
                progress={progress}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />

            {showDescriptionPopup && (
                <DescriptionPopup
                    description={selectedDescription}
                    onClose={closeDescriptionPopup}
                />
            )}
            {showImportModal && (
                <WorkOrderImportModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onConfirm={handleConfirmImport}
                />
            )}
        </div>
    );
};

export default WorkOrderPage;
