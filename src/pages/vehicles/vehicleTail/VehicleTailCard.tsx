import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faTrailer, faBuilding, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ITruckHead, ITruckTail } from "../../../api/components/truckApi";

type Vehicle = ITruckHead | ITruckTail;

interface VehicleCardProps {
    truck: Vehicle;
    type: "head" | "tail"; // บอกว่าเป็น หัว หรือ ท้าย
    onEdit: (truck: Vehicle) => void;
    onDelete: (id: string) => void;
}

export default function VehicleCard({ truck, type, onEdit, onDelete }: VehicleCardProps) {
    return (
        <div className="vehicle-card">
            <div className="card-header">
                <h3 className="vehicle-registration">
                    <FontAwesomeIcon
                        icon={type === "head" ? faTruck : faTrailer}
                        className="card-icon"
                    />
                    {truck.licensePlate}
                </h3>
                <div className="card-actions">
                    <button
                        className="edit-btn"
                        onClick={() => onEdit(truck)}
                        title="แก้ไข"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(truck._id!)}
                        title="ลบ"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            </div>
            <div className="card-content">
                <p>
                    <FontAwesomeIcon icon={faBuilding} className="info-icon" />
                    <strong>บริษัท:</strong> {truck.companyName}
                </p>
                {truck.createdAt && (
                    <p className="created-date">
                        <strong>สร้างเมื่อ:</strong>{" "}
                        {new Date(truck.createdAt).toLocaleDateString("th-TH")}
                    </p>
                )}
            </div>
        </div>
    );
}
