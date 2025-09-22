import React, { useEffect, useState } from "react";
import {
    fetchTruckTails,
    createTruckTail,
    updateTruckTail,
    deleteTruckTail,
    ITruckTail,
} from "../../api/components/truckApi";
import VehicleTailHeader from "./vehicleTail/VehicleTailHeader";
import VehicleTailGrid from "./vehicleTail/VehicleGrid";
import VehicleTailModal from "./vehicleTail/VehicleTailModal";
import "../../styles/pages/VehiclePage.css";

const VehicleTailPage: React.FC = () => {
    const [truckTails, setTruckTails] = useState<ITruckTail[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingTruck, setEditingTruck] = useState<ITruckTail | null>(null);
    const [form, setForm] = useState({ licensePlate: "", companyName: "" });
    const [submitting, setSubmitting] = useState(false);

    const loadTruckTails = async () => {
        const data = await fetchTruckTails();
        setTruckTails(data.map((d) => ({ ...d, companyName: (d.companyName || "").trim() })));
    };

    useEffect(() => {
        loadTruckTails();
    }, []);

    const filteredTruckTails = truckTails.filter((truck) => {
        const term = searchTerm.trim().toLowerCase();
        const license = (truck.licensePlate || "").toLowerCase();
        const company = (truck.companyName || "").toLowerCase();
        const matchesTerm = !term || license.includes(term) || company.includes(term);
        const matchesCompany = selectedCompany === "all" || truck.companyName === selectedCompany;
        return matchesTerm && matchesCompany;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTruck) {
                await updateTruckTail(editingTruck._id!, form);
            } else {
                await createTruckTail(form);
            }
            await loadTruckTails();
            handleCloseModal();
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (truck: ITruckTail) => {
        setEditingTruck(truck);
        setForm({ licensePlate: truck.licensePlate, companyName: truck.companyName });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) {
            await deleteTruckTail(id);
            await loadTruckTails();
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTruck(null);
        setForm({ licensePlate: "", companyName: "" });
    };

    return (
        <div className="vehicle-page">
            <VehicleTailHeader
                onRefresh={loadTruckTails}
                onAdd={() => setShowModal(true)}
                totalCount={filteredTruckTails.length}
                searchTerm={searchTerm}
                selectedCompany={selectedCompany}
                onSearch={setSearchTerm}
                onFilter={setSelectedCompany}
            />

            <VehicleTailGrid items={filteredTruckTails} onEdit={handleEdit} onDelete={handleDelete} />

            <VehicleTailModal
                visible={showModal}
                editing={editingTruck}
                form={form}
                submitting={submitting}
                onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                onSubmit={handleSubmit}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default VehicleTailPage;
