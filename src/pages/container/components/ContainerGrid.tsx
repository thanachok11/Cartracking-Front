import React, { useState } from "react";
import { Containers } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../../i18n";

interface Props {
    items: Containers[];
    onEdit: (c: Containers) => void;
    onDelete: (id: string) => void;
}

export default function ContainerGrid({ items, onEdit, onDelete }: Props) {
    const { t } = useI18n();
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // คำนวณข้อมูลที่จะโชว์
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (!items.length) {
        return (
            <div className="grid-container-page-no-results">
                <h3>{t('containers.noData.title')}</h3>
                <p>{t('containers.noData.subtitle')}</p>
            </div>
        );
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

            {/* แสดงรายการ */}
            <div className="grid-container-page">
                {currentItems.map((c) => (
                    <div key={c._id} className="grid-container-page-card">
                        <h3>{c.containerNumber || "N/A"}</h3>
                        <p>
                            <strong>{t('containers.form.companyName')}:</strong> {
                                c.companyName === 'ป๋อเฉิน' 
                                    ? t('containers.company.porchoen')
                                    : c.companyName === 'บริษัทร่วม' 
                                        ? t('containers.company.rotruam')
                                        : c.companyName || "N/A"
                            }
                        </p>
                        <p>
                            <strong>{t('containers.form.size')}:</strong> {c.containerSize || "N/A"}
                        </p>
                        {/* <div className="grid-container-page-id">ID: {c._id}</div> */}

                        <div className="card-actions">
                            <button
                                className="edit-btn"
                                onClick={() => onEdit(c)}
                                title={t('common.edit')}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => c._id && onDelete(c._id)}
                                title={t('common.delete')}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
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
