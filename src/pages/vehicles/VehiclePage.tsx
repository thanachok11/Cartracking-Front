import React, { useEffect, useState } from 'react';
import { fetchTruckHeads, createTruckHead, updateTruckHead, deleteTruckHead, ITruckHead } from '../../api/components/truckApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faPlus,
    faEdit,
    faTrash,
    faTruck,
    faBuilding,
    faSync
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/pages/VehiclePage.css';

const VehiclePage: React.FC = () => {
    const [truckHeads, setTruckHeads] = useState<ITruckHead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Modal states
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingTruck, setEditingTruck] = useState<ITruckHead | null>(null);
    const [form, setForm] = useState<Omit<ITruckHead, '_id' | 'createdAt' | 'updatedAt'>>({
        licensePlate: '',
        companyName: ''
    });

    useEffect(() => {
        loadTruckHeads();
    }, []);

    const loadTruckHeads = async () => {
        try {
            setLoading(true);
            const data = await fetchTruckHeads();
            // Normalize companyName (trim) to avoid whitespace mismatch
            const normalized = data.map(d => ({ ...d, companyName: (d.companyName || '').toString().trim() }));
            setTruckHeads(normalized);
            setError(null);
        } catch (error) {
            console.error('Error fetching truck heads:', error);
            setError('ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง');
            setTruckHeads([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTruckHeads = truckHeads.filter(truck => {
        const term = searchTerm.trim().toLowerCase();
        const license = (truck.licensePlate || '').toString().toLowerCase();
        const companyRaw = (truck.companyName || '').toString();
        const company = companyRaw.trim().toLowerCase();
        const matchesTerm = !term || license.includes(term) || company.includes(term);
        const matchesCompany = selectedCompany === 'all' || companyRaw.trim() === selectedCompany;
        return matchesTerm && matchesCompany;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return; // ป้องกันการส่งซ้ำ

        try {
            setSubmitting(true);
            const payload = { ...form, companyName: (form.companyName || '').toString().trim() };
            if (editingTruck) {
                await updateTruckHead(editingTruck._id!, payload);
            } else {
                await createTruckHead(payload);
            }
            await loadTruckHeads();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving truck head:', error);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false); // คืนค่า disable ปุ่ม
        }
    };

    const handleEdit = (truck: ITruckHead) => {
        setEditingTruck(truck);
        setForm({
            licensePlate: truck.licensePlate,
            companyName: truck.companyName
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            try {
                await deleteTruckHead(id);
                await loadTruckHeads();
            } catch (error) {
                console.error('Error deleting truck head:', error);
                setError('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTruck(null);
        setForm({ licensePlate: '', companyName: '' });
    };

    const handleInputChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Function สำหรับ format ทะเบียนรถ xxx-xxxx
    const formatLicensePlate = (value: string): string => {
        // ลบตัวอักษรที่ไม่ใช่ตัวอักษรและตัวเลข
        const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // จำกัดความยาวไม่เกิน 7 ตัวอักษร
        const limited = cleaned.slice(0, 7);

        // เพิ่ม dash หลังตัวอักษรที่ 3
        if (limited.length > 3) {
            return limited.slice(0, 3) + '-' + limited.slice(3);
        }
        return limited;
    };

    const handleLicensePlateChange = (value: string) => {
        const formatted = formatLicensePlate(value);
        setForm(prev => ({ ...prev, licensePlate: formatted }));
    };

    if (loading) return <div className="loading">กำลังโหลดข้อมูล...</div>;

    if (error) {
        return (
            <div className="vehicle-page">
                <div className="header-row">
                    <h1 className="page-title">ทะเบียนหัว</h1>
                </div>
                <div className="error-container">
                    <div className="error-message">
                        <h3>⚠️ การเชื่อมต่อมีปัญหา</h3>
                        <p>{error}</p>
                        <button
                            className="retry-btn"
                            onClick={loadTruckHeads}
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-page">
            <div className="header-row">
                <h1 className="page-title">ทะเบียนหัว</h1>
                <div className="result-count">แสดง {filteredTruckHeads.length} รายการ</div>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="ค้นหาทะเบียนหรือบริษัท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="company-filter">
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="company-select"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                            <option value="รถร่วม">รถร่วม</option>
                        </select>
                    </div>
                    <div className="action-buttons">
                        <button
                            className="refresh-btn"
                            onClick={loadTruckHeads}
                            disabled={loading}
                            title="รีเฟรช"
                        >
                            <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} />
                            รีเฟรช
                        </button>
                        <button
                            className="add-btn"
                            onClick={() => setShowModal(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            เพิ่มทะเบียนหัว
                        </button>
                    </div>
                </div>
            </div>

            <div className="vehicle-grid">
                {filteredTruckHeads.length === 0 ? (
                    <div className="no-results">
                        <p>ไม่พบข้อมูลทะเบียนหัว{searchTerm && ` ที่ตรงกับ "${searchTerm}"`}</p>
                    </div>
                ) : (
                    filteredTruckHeads.map(truck => (
                        <div key={truck._id} className="vehicle-card">
                            <div className="card-header">
                                <h3 className="vehicle-registration">
                                    <FontAwesomeIcon icon={faTruck} className="card-icon" />
                                    {truck.licensePlate}
                                </h3>
                                <div className="card-actions">
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEdit(truck)}
                                        title="แก้ไข"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(truck._id!)}
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
                                        <strong>สร้างเมื่อ:</strong> {new Date(truck.createdAt).toLocaleDateString('th-TH')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="popup-overlay" onClick={handleCloseModal}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-header">
                            <div className="popup-title">
                                <FontAwesomeIcon icon={faTruck} className="popup-icon" />
                                <h2>{editingTruck ? 'แก้ไขทะเบียนหัว' : 'เพิ่มทะเบียนหัวใหม่'}</h2>
                            </div>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="popup-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="licensePlate">ทะเบียนรถ *</label>
                                    <input
                                        type="text"
                                        id="licensePlate"
                                        value={form.licensePlate}
                                        onChange={(e) => handleLicensePlateChange(e.target.value)}
                                        placeholder="xxx-xxxx"
                                        maxLength={8}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="companyName">ชื่อบริษัท *</label>
                                    <select
                                        id="companyName"
                                        value={form.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        required
                                    >
                                        <option value="">-- เลือกบริษัท --</option>
                                        <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                                        <option value="รถร่วม">รถร่วม</option>
                                    </select>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={handleCloseModal} className="cancel-btn">
                                        ยกเลิก
                                    </button>
                                    <button type="submit" className="save-btn" disabled={submitting}>
                                        {submitting ? 'กำลังบันทึก...' : (editingTruck ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehiclePage;
