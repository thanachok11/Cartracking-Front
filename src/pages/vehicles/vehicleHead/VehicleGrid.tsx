import React, { useState } from "react";
import { ITruckHead } from "../../../api/components/truckApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faEdit, faTrash, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../../i18n";

interface VehicleGridProps {
    items: ITruckHead[];
    onEdit: (truck: ITruckHead) => void;
    onDelete: (id: string) => void;
}

export default function VehicleGrid({ items, onEdit, onDelete }: VehicleGridProps) {
    const { t, lang } = useI18n();
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // คำนวณข้อมูลที่จะโชว์
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (items.length === 0) {
        return <div className="no-results">{t('vehicles.noData.head')}</div>;
    }

    return (
        <div>
            {/* ตัวเลือกจำนวนที่แสดง */}
            <div className="grid-container-page-controls">
                <label>
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
                    &nbsp;{t('common.itemsPerPage')}
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
                                <strong>{t('vehicles.form.companyName')}:</strong> {
                                    truck.companyName === 'ป๋อเฉิน' 
                                        ? t('vehicles.company.porchoen')
                                        : truck.companyName === 'รถร่วม' 
                                            ? t('vehicles.company.rotruam')
                                            : truck.companyName
                                }
                            </p>
                            {truck.createdAt && (
                                <p className="created-date">
                                    <strong>{t('vehicles.grid.createdAt')}:</strong>{" "}
                                    {new Date(truck.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US')}
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
                        ◀ {t('common.previous')}
                    </button>
                    <span>
                        {t('datatoday.pagination.page', { current: String(currentPage), total: String(totalPages) })}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        {t('common.next')} ▶
                    </button>
                </div>
            )}
        </div>
    );
}
