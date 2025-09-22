import React, { useState } from "react";
import { ITruckTail } from "../../../api/components/truckApi";
import VehicleCard from "./VehicleTailCard";

interface VehicleTailGridProps {
    items: ITruckTail[];
    onEdit: (truck: ITruckTail) => void;
    onDelete: (id: string) => void;
}

export default function VehicleTailGrid({ items, onEdit, onDelete }: VehicleTailGridProps) {
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (items.length === 0) {
        return <div className="no-results">ไม่พบข้อมูลทะเบียนหาง</div>;
    }

    return (
        <div>
            <div className="grid-container-page-controls">
                <label>
                    แสดง&nbsp;
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={40}>40</option>
                    </select>
                    &nbsp;รายการต่อหน้า
                </label>
            </div>

            <div className="vehicle-grid">
                {currentItems.map((truck) => (
                    <VehicleCard
                        key={truck._id}
                        truck={truck}
                        type="tail"
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        ◀ ก่อนหน้า
                    </button>
                    <span>
                        หน้า {currentPage} จาก {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        ถัดไป ▶
                    </button>
                </div>
            )}
        </div>
    );
}
