import React, { useEffect, useState, useCallback } from "react";
import {
    fetchTruckHeads,
    createTruckHead,
    updateTruckHead,
    deleteTruckHead,
    ITruckHead,
} from "../../api/components/truckApi";
import "../../styles/pages/VehiclePage.css";
import VehicleHeader from "./vehicleHead/VehicleHeader";
import VehicleGrid from "./vehicleHead/VehicleGrid";
import VehicleModal from "./vehicleHead/VehicleModal";
import { useNotification } from "../../hooks/useNotification";
import NotificationToast from "../../components/common/NotificationToast";
import { useI18n } from "../../i18n";

const VehiclePage: React.FC = () => {
    const { t } = useI18n();
    const [truckHeads, setTruckHeads] = useState<ITruckHead[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingTruck, setEditingTruck] = useState<ITruckHead | null>(null);
    const [form, setForm] = useState({ licensePlate: "", companyName: "" });

    const { notification, progress, showNotification, handleMouseEnter, handleMouseLeave } = useNotification();

    // Format license plate input (xxx-xxxx)
    const formatLicensePlate = (value: string): string => {
        // Remove all non-alphanumeric characters and convert to uppercase
        const cleaned = value.replace(/[^0-9]/g, '').toUpperCase();
        // Limit to 7 characters
        const limited = cleaned.slice(0, 7);
        // Add dash after 3rd character
        if (limited.length > 3) {
            return limited.slice(0, 3) + '-' + limited.slice(3);
        }
        return limited;
    };

    const handleSearchChange = (value: string) => {
        const formatted = formatLicensePlate(value);
        setSearchTerm(formatted);
    };

    const loadTruckHeads = useCallback(async () => {
        try {
            const data = await fetchTruckHeads();
            const normalized = data.map((d) => ({
                ...d,
                companyName: (d.companyName || "").trim(),
            }));
            setTruckHeads(normalized);
        } catch (e) {
            setError(t('common.noData'));
        }
    }, [t]);

    useEffect(() => {
        loadTruckHeads();
    }, [loadTruckHeads]);

    const filteredTruckHeads = truckHeads.filter((truck) => {
        const term = searchTerm.trim().toLowerCase();
        const license = (truck.licensePlate || "").toLowerCase();
        const matchesTerm = !term || license.includes(term);
        const matchesCompany =
            selectedCompany === "all" || truck.companyName === selectedCompany;
        return matchesTerm && matchesCompany;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTruck) {
                await updateTruckHead(editingTruck._id!, form);
                showNotification(`${t('common.save')} ✅`, "success");
            } else {
                await createTruckHead(form);
                showNotification(`${t('vehicles.add.head')} ✅`, "success");
            }
            await loadTruckHeads();
            setShowModal(false);
            setForm({ licensePlate: "", companyName: "" });
            setEditingTruck(null);
        } catch (error) {
            showNotification(`${t('common.noData')} ❌`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (truck: ITruckHead) => {
        setEditingTruck(truck);
        setForm({ licensePlate: truck.licensePlate, companyName: truck.companyName });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`${t('common.delete')}?`)) {
            try {
                await deleteTruckHead(id);
                await loadTruckHeads();
                showNotification(`${t('common.delete')} ✅`, "success");
            } catch (error) {
                showNotification(`${t('common.noData')} ❌`, "error");
            }
        }
    };

    return (
        <div className="vehicle-page">
            <VehicleHeader
                onRefresh={loadTruckHeads}
                onAdd={() => setShowModal(true)}
                totalCount={filteredTruckHeads.length}
                searchTerm={searchTerm}
                selectedCompany={selectedCompany}
                onSearch={handleSearchChange}
                onFilter={setSelectedCompany}
            />

            {error ? (
                <div className="error-message">{error}</div>
            ) : (
                <VehicleGrid items={filteredTruckHeads} onEdit={handleEdit} onDelete={handleDelete} />
            )}

            <VehicleModal
                visible={showModal}
                editing={editingTruck}
                form={form}
                submitting={submitting}
                onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                onSubmit={handleSubmit}
                onClose={() => setShowModal(false)}
            />

            <NotificationToast
                message={notification?.message}
                type={notification?.type}
                progress={progress}
                isHovering={false}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    );
};

export default VehiclePage;
