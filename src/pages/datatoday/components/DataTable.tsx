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
    const openPreview = (src?: string) => {
        if (!src) return;
        setPreviewSrc(src);
        setPreviewVisible(true);
    };
    const closePreview = () => { setPreviewVisible(false); setPreviewSrc(null); };
    return (
        <>
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

                            <th>ตำแหน่ง</th>
                            <th>บริษัท</th>
                            <th>รูปใบสั่งงาน</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
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
                        ))}
                    </tbody>
                </table>
            </div>
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
