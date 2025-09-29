import React, { useState } from "react";
import { ITruckTail } from "../../../api/components/truckApi";
import VehicleCard from "./VehicleTailCard";
import { useI18n } from "../../../i18n";

interface VehicleTailGridProps {
    items: ITruckTail[];
    onEdit: (truck: ITruckTail) => void;
    onDelete: (id: string) => void;
}

export default function VehicleTailGrid({ items, onEdit, onDelete }: VehicleTailGridProps) {
    const { t } = useI18n();
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (items.length === 0) {
        return <div className="no-results">{t('vehicles.noData.tail')}</div>;
    }

    return (
        <div>
            <div className="grid-container-page-controls">
                <label>
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
                    &nbsp;{t('common.itemsPerPage')}
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
                        ◀ {t('common.previous')}
                    </button>
                    <span>
                        {t('datatoday.pagination.page', { current: String(currentPage), total: String(totalPages) })}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        {t('common.next')} ▶
                    </button>
                </div>
            )}
        </div>
    );
}
