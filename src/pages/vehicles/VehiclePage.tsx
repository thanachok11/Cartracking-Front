import React, { useEffect, useState } from "react";
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

const VehiclePage: React.FC = () => {
    const [truckHeads, setTruckHeads] = useState<ITruckHead[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingTruck, setEditingTruck] = useState<ITruckHead | null>(null);
    const [form, setForm] = useState({ licensePlate: "", companyName: "" });

    const loadTruckHeads = async () => {
        try {
            setLoading(true);
            const data = await fetchTruckHeads();
            const normalized = data.map((d) => ({
                ...d,
                companyName: (d.companyName || "").trim(),
            }));
            setTruckHeads(normalized);
        } catch (e) {
            setError("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTruckHeads();
    }, []);

    const filteredTruckHeads = truckHeads.filter((truck) => {
        const term = searchTerm.trim().toLowerCase();
        const license = (truck.licensePlate || "").toLowerCase();
        const company = (truck.companyName || "").toLowerCase();
        const matchesTerm = !term || license.includes(term) || company.includes(term);
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
            } else {
                await createTruckHead(form);
            }
            await loadTruckHeads();
            setShowModal(false);
            setForm({ licensePlate: "", companyName: "" });
            setEditingTruck(null);
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
        if (window.confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) {
            await deleteTruckHead(id);
            await loadTruckHeads();
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
                onSearch={setSearchTerm}
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
        </div>
    );
};

export default VehiclePage;
