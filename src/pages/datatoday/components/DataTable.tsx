import React from "react";
import { DataToday } from "../../../types/DataToday";
import { IWorkOrder } from "../../../types/WorkOrder";
import { fetchWorkOrderById, fetchWorkOrderByNumber } from "../../../api/components/orderApi";

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
    
    // 👇 state สำหรับ work order popup
    const [workOrder, setWorkOrder] = React.useState<IWorkOrder | null>(null);
    const [workOrderVisible, setWorkOrderVisible] = React.useState(false);
    const [loadingWorkOrder, setLoadingWorkOrder] = React.useState(false);

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

    // 👇 function สำหรับเปิด work order popup
    const openWorkOrderPopup = async (workOrderNumber: string) => {
        if (!workOrderNumber) return;
        
        setLoadingWorkOrder(true);
        setWorkOrderVisible(true);
        
        try {
            console.log('🔍 Searching for work order:', workOrderNumber);
            
            // ค้นหาข้อมูลจาก API จริง
            const workOrderData = await fetchWorkOrderByNumber(workOrderNumber);
            
            if (workOrderData) {
                console.log('✅ Work order found:', workOrderData);
                setWorkOrder(workOrderData);
            } else {
                console.log('❌ Work order not found:', workOrderNumber);
                setWorkOrder(null);
            }
        } catch (error) {
            console.error('❌ Error loading work order:', error);
            setWorkOrder(null);
        } finally {
            setLoadingWorkOrder(false);
        }
    };

    const closeWorkOrderPopup = () => {
        setWorkOrderVisible(false);
        setWorkOrder(null);
    };

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
                            <th>เลขใบสั่งงาน</th>
                            <th>วันที่</th>
                            <th>คนขับ</th>
                            <th>ทะเบียนหัว</th>
                            <th>ทะเบียนหาง</th>
                            <th>หมายเลขตู้</th>
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
                                    <td>
                                        {(r as any).booking_id ? (
                                            <button 
                                                onClick={() => openWorkOrderPopup((r as any).booking_id)} 
                                                className="data-today-btn-link"
                                            >
                                                {(r as any).booking_id}
                                            </button>
                                        ) : '-'}
                                    </td>
                                    <td>{ymdToDmy(r.datetime_in)}</td>
                                    <td>{r.driver_name}</td>
                                    <td>{r.head_registration}</td>
                                    <td>{r.tail_registration}</td>
                                    <td>{r.container_no}</td>
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

            {/* Work Order Popup */}
            {workOrderVisible && (
                <div className="data-today-modal-preview-backdrop" onClick={closeWorkOrderPopup}>
                    <div className="data-today-modal-preview" onClick={(e) => e.stopPropagation()}>
                        <div className="work-order-popup">
                            <div className="work-order-popup-header">
                                <h3>ข้อมูลใบสั่งงาน</h3>
                                <button className="data-today-modal-preview-close" onClick={closeWorkOrderPopup}>ปิด</button>
                            </div>
                            
                            {loadingWorkOrder ? (
                                <div className="work-order-loading">
                                    <p>กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : workOrder ? (
                                <div className="work-order-content">
                                    <div className="work-order-field">
                                        <label>เลขใบสั่งงาน:</label>
                                        <span>{workOrder.workOrderNumber}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>วันที่ออกใบสั่ง:</label>
                                        <span>{workOrder.issueDate ? new Date(workOrder.issueDate).toLocaleDateString('th-TH') : '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>สินค้า:</label>
                                        <span>{workOrder.product || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>คนขับ:</label>
                                        <span>{workOrder.driverName || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>เบอร์โทร:</label>
                                        <span>{workOrder.driverPhone || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>ทะเบียนหัว | หาง:</label>
                                        <span>{workOrder.headPlate || '-'} | {workOrder.tailPlate || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>หมายเลขตู้:</label>
                                        <span>{workOrder.containerNumber || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>บริษัท:</label>
                                        <span>{workOrder.companyName || '-'}</span>
                                    </div>
                                    <div className="work-order-field">
                                        <label>รายละเอียด:</label>
                                        <span>{workOrder.description || '-'}</span>
                                    </div>
                                    {workOrder.createdAt && (
                                        <div className="work-order-field">
                                            <label>สร้างเมื่อ:</label>
                                            <span>{new Date(workOrder.createdAt).toLocaleString('th-TH')}</span>
                                        </div>
                                    )}
                                    {workOrder.updatedAt && (
                                        <div className="work-order-field">
                                            <label>แก้ไขเมื่อ:</label>
                                            <span>{new Date(workOrder.updatedAt).toLocaleString('th-TH')}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="work-order-error">
                                    <p>ไม่พบข้อมูลใบสั่งงานในระบบ</p>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                                        กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลใบสั่งงาน
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
