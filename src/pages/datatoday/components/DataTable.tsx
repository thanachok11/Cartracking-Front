import React from "react";
import { DataToday } from "../../../types/DataToday";

interface DataTableProps {
    rows: DataToday[];
    onEdit: (r: DataToday) => void;
    onDelete: (id?: string) => void;
    openOnMap: (station?: string) => void;
    ymdToDmy: (ymd?: string) => string;
}

export default function DataTable({ rows, onEdit, onDelete, openOnMap, ymdToDmy }: DataTableProps) {
    const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = React.useState(false);

    // 👇 state สำหรับ pagination
    const [itemsPerPage, setItemsPerPage] = React.useState(10); // ค่าเริ่มต้น 10
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(rows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedRows = rows.slice(startIndex, startIndex + itemsPerPage);

    const openPreview = (src?: string) => {
        if (!src) return;
        setPreviewSrc(src);
        setPreviewVisible(true);
    };
    const closePreview = () => { setPreviewVisible(false); setPreviewSrc(null); };

    return (
        <>
            <div className="data-today-table-controls">
                <label>
                    แสดง&nbsp;
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1); // reset กลับไปหน้าแรก
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

            <div className="data-today-table-wrap">
                <table className="data-today-table">
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th>คนขับ</th>
                            <th>ทะเบียนหัว</th>
                            <th>ทะเบียนหาง</th>
                            <th>หมายเลขตู้</th>
                            <th>เลขใบสั่งงาน</th>
                            <th>ตำแหน่งคนขับรถ</th>
                            <th>บริษัท</th>
                            <th>รูปใบสั่งงาน</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedRows.length === 0 ? (
                            <tr>
                                <td colSpan={10} style={{ textAlign: "center", padding: "20px" }}>
                                    ไม่พบข้อมูลที่ค้นหา
                                </td>
                            </tr>
                        ) : (
                            displayedRows.map((r) => (
                                <tr key={r._id} className="data-today-row">
                                    <td>{ymdToDmy(r.datetime_in)}</td>
                                    <td>{r.driver_name}</td>
                                    <td>{r.head_registration}</td>
                                    <td>{r.tail_registration}</td>
                                    <td>{r.container_no}</td>
                                    <td>{(r as any).booking_id || '-'}</td>
                                    <td>
                                        <button onClick={() => openOnMap(r.station_in)} className="data-today-btn-link">
                                            {r.station_in}
                                        </button>
                                    </td>
                                    <td>{r.companyname}</td>
                                    <td>
                                        {(r as any).booking_image ? (
                                            <button type="button" className="link-button" onClick={() => openPreview((r as any).booking_image)}>
                                                ดูเอกสาร
                                            </button>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="data-today-btn data-today-btn-small data-today-btn-edit"
                                                onClick={() => onEdit(r)}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                className="data-today-btn data-today-btn-small data-today-btn-danger"
                                                onClick={() => onDelete(r._id)}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 👇 pagination control */}
            {rows.length > itemsPerPage && (
                <div className="data-today-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        ก่อนหน้า
                    </button>
                    <span>หน้า {currentPage} จาก {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        ถัดไป
                    </button>
                </div>
            )}

            {previewVisible && previewSrc && (
                <div className="data-today-modal-preview-backdrop" onClick={closePreview}>
                    <div className="data-today-modal-preview" onClick={(e) => e.stopPropagation()}>
                        <button className="data-today-modal-preview-close" onClick={closePreview}>ปิด</button>
                        <img src={previewSrc || undefined} alt="preview" style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
                    </div>
                </div>
            )}
        </>
    );
}
