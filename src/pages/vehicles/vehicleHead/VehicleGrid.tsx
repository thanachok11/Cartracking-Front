import React, { useState } from "react";
import { ITruckHead } from "../../../api/components/truckApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faEdit, faTrash, faBuilding } from "@fortawesome/free-solid-svg-icons";

interface VehicleGridProps {
    items: ITruckHead[];
    onEdit: (truck: ITruckHead) => void;
    onDelete: (id: string) => void;
}

export default function VehicleGrid({ items, onEdit, onDelete }: VehicleGridProps) {
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // คำนวณข้อมูลที่จะโชว์
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (items.length === 0) {
        return <div className="no-results">ไม่พบข้อมูลทะเบียนหัว</div>;
    }

    return (
        <div>
            {/* ตัวเลือกจำนวนที่แสดง */}
            <div className="grid-container-page-controls">
                <label>
                    แสดง&nbsp;
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1); // reset ไปหน้าแรก
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

            {/* แสดง card */}
            <div className="vehicle-grid">
                {currentItems.map((truck) => (
                    <div key={truck._id} className="vehicle-card">
                        <div className="card-header">
                            <h3 className="vehicle-registration">
                                <FontAwesomeIcon icon={faTruck} className="card-icon" />
                                {truck.licensePlate}
                            </h3>
                            <div className="card-actions">
                                <button className="edit-btn" onClick={() => onEdit(truck)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="delete-btn" onClick={() => onDelete(truck._id!)}>
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
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        ◀ ก่อนหน้า
                    </button>
                    <span>
                        หน้า {currentPage} จาก {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        ถัดไป ▶
                    </button>
                </div>
            )}
        </div>
    );
}
