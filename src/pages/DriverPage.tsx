import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    fetchAllDrivers, 
    createDriver, 
    updateDriver, 
    deleteDriver, 
    Driver 
} from '../api/components/driversApi';
import '../styles/pages/DriverPage.css';

const DriverPage: React.FC = () => {
    // Optimized state management
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filterBy, setFilterBy] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Omit<Driver, '_id'>>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        position: '',
        company: '',
        detail: '',
        profile_img: ''
    });

    // Handle API errors
    const handleApiError = (error: any, defaultMessage: string) => {
        console.error('API Error:', error);
        console.error('Error response:', error?.response);
        console.error('Error status:', error?.response?.status);
        console.error('Error data:', error?.response?.data);
        
        // Check if it's an authentication error (401, 403) - don't logout, just show message
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            setError(`ไม่มีสิทธิ์เข้าถึงข้อมูล (${error.response.status}) - กรุณาตรวจสอบการเข้าสู่ระบบ`);
            return;
        }
        
        // Check if it's a network error or server unavailable
        if (!error.response || error.response.status >= 500) {
            setError(`เซิร์ฟเวอร์ไม่พร้อมใช้งาน (${error.response?.status || 'Network Error'}) - กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ`);
            return;
        }
        
        // Other API errors with more details
        const errorMsg = error?.response?.data?.message || error?.message || defaultMessage;
        setError(`${defaultMessage} (${error.response?.status}): ${errorMsg}`);
    };

    const filteredDrivers = useMemo(() => {
        console.log('🔍 Filtering drivers:', {
            totalDrivers: drivers.length,
            searchTerm,
            filterBy,
            driversData: drivers
        });
        
        return drivers.filter(driver => {
            const fullName = `${driver?.firstName || ''} ${driver?.lastName || ''}`;
            const company = driver?.company || '';
            const position = driver?.position || '';
            
            const searchMatch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               position.toLowerCase().includes(searchTerm.toLowerCase());
            
            let categoryMatch = true;
            if (filterBy === 'po-chern') {
                categoryMatch = company.includes('ป๋อเฉิน');
            } else if (filterBy === 'rot-ruam') {
                categoryMatch = company.includes('รถร่วม');
            } else if (filterBy === 'driver') {
                categoryMatch = position.toLowerCase().includes('driver') || position.toLowerCase().includes('คนขับ');
            }
            
            return searchMatch && categoryMatch;
        });
    }, [drivers, searchTerm, filterBy]);

    // Optimized load function with retry
    const loadDrivers = useCallback(async (retries = 3) => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔄 Loading drivers from API...');
            
            const driverData = await fetchAllDrivers();
            console.log('✅ Raw driver data received:', driverData);
            console.log('📊 Number of drivers:', driverData?.length || 0);
            
            setDrivers(driverData || []);
            setError(null);
        } catch (error: any) {
            console.error(`❌ Load drivers error (${4 - retries} attempt):`, error);
            console.error('Error details:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data
            });
            handleApiError(error, 'ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง');
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Optimized form handlers
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setEditingDriver(null);
        setError(null);
    }, []);

    const handleCreate = useCallback(async () => {
        try {
            setSaving(true);
            setError(null);

            await createDriver(formData);
            await loadDrivers();
            handleCloseModal();
        } catch (error) {
            handleApiError(error, 'เกิดข้อผิดพลาดในการสร้างข้อมูลคนขับ');
        } finally {
            setSaving(false);
        }
    }, [formData, loadDrivers, handleCloseModal]);

    const handleUpdate = useCallback(async () => {
        if (!editingDriver) return;

        try {
            setSaving(true);
            setError(null);

            await updateDriver(editingDriver._id!, formData);
            await loadDrivers();
            handleCloseModal();
        } catch (error) {
            console.error('❌ Update driver error:', error);
            handleApiError(error, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลคนขับ');
        } finally {
            setSaving(false);
        }
    }, [editingDriver, formData, loadDrivers, handleCloseModal]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบคนขับคนนี้?')) return;

        try {
            await deleteDriver(id);
            await loadDrivers();
        } catch (error) {
            handleApiError(error, 'เกิดข้อผิดพลาดในการลบข้อมูลคนขับ');
        }
    }, [loadDrivers]);

    const handleOpenModal = useCallback((driver?: Driver) => {
        if (driver) {
            setEditingDriver(driver);
            setFormData({
                firstName: driver.firstName || '',
                lastName: driver.lastName || '',
                phoneNumber: driver.phoneNumber || '',
                position: driver.position || '',
                company: driver.company || '',
                detail: driver.detail || '',
                profile_img: driver.profile_img || ''
            });
        } else {
            setEditingDriver(null);
            setFormData({
                firstName: '',
                lastName: '',
                phoneNumber: '',
                position: '',
                company: '',
                detail: '',
                profile_img: ''
            });
        }
        setShowModal(true);
    }, []);

    const handleSave = useCallback(() => {
        editingDriver ? handleUpdate() : handleCreate();
    }, [editingDriver, handleUpdate, handleCreate]);

    // Load data on mount
    useEffect(() => {
        console.log('🚀 DriverPage mounted, checking authentication...');
        const token = localStorage.getItem('token');
        console.log('🔑 Token status:', token ? 'Present' : 'Missing');
        
        console.log('🔄 Loading drivers regardless of token status...');
        loadDrivers();
    }, [loadDrivers]);

    if (loading) return <div className="loading">Loading Driver Data...</div>;

    if (error) {
        return (
            <div className="driver-page">
                <div className="header-row">
                    <h2 className="page-title">All Drivers Information</h2>
                    <button className="add-driver-button" disabled>+ Add Driver</button>
                </div>
                <div className="error-container">
                    <div className="error-message">
                        <h3>⚠️ การเชื่อมต่อมีปัญหา</h3>
                        <p>{error}</p>
                        <button 
                            className="retry-button" 
                            onClick={() => loadDrivers()}
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="driver-page">
            {/* Header */}
            <div className="header-row">
                <h2 className="page-title">All Drivers Information</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="add-driver-button"
                        onClick={() => loadDrivers()}
                        style={{ backgroundColor: '#10b981' }}
                    >
                        🔄 Refresh
                    </button>
                    <button 
                        className="add-driver-button"
                        onClick={() => handleOpenModal()}
                    >
                        + Add Driver
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="search-container">
                <div className="search-and-sort">
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อคนขับ, บริษัท หรือตำแหน่ง..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="po-chern">ป๋อเฉิน</option>
                        <option value="rot-ruam">รถร่วม</option>
                        <option value="driver">คนขับ</option>
                    </select>
                </div>
                {(searchTerm || filterBy !== 'all') && (
                    <p className="search-results">
                        Found {filteredDrivers.length} driver(s)
                    </p>
                )}
            </div>

            {/* Driver Grid */}
            <div className="driver-grid">
                {filteredDrivers.length === 0 && !searchTerm ? (
                    <div className="no-results">
                        <p>ไม่มีข้อมูลคนขับ</p>
                        {drivers.length === 0 ? (
                            <p>ไม่พบข้อมูลคนขับในระบบ กรุณาตรวจสอบการเชื่อมต่อ API</p>
                        ) : (
                            <p>ลองปรับเปลี่ยนตัวกรองข้อมูล</p>
                        )}
                    </div>
                ) : filteredDrivers.length === 0 && searchTerm ? (
                    <div className="no-results">
                        <p>No drivers found matching "{searchTerm}"</p>
                        <p>Try adjusting your search term.</p>
                    </div>
                ) : (
                    filteredDrivers.map((driver) => (
                        <div className="driver-card" key={driver._id}>
                            {driver.profile_img && (
                                <img
                                    src={driver.profile_img}
                                    alt={`${driver.firstName} ${driver.lastName}`}
                                    className="profile-img"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <div className="driver-info">
                                <h3>{driver.firstName} {driver.lastName}</h3>
                                <p><strong>Position:</strong> {driver.position}</p>
                                <p><strong>Company:</strong> {driver.company}</p>
                                <p><strong>Phone:</strong> {driver.phoneNumber}</p>
                            </div>
                            <div className="driver-id">
                                ID: {driver._id}
                            </div>
                            <div className="card-actions">
                                <button 
                                    className="edit-btn"
                                    onClick={() => handleOpenModal(driver)}
                                >
                                    แก้ไข
                                </button>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDelete(driver._id!)}
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal สำหรับ Add/Edit Driver */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingDriver ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับใหม่'}</h3>
                        {error && <div className="error-alert">{error}</div>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ชื่อ:</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>นามสกุล:</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>เบอร์โทรศัพท์:</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ตำแหน่ง:</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>บริษัท:</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>รายละเอียด:</label>
                                <textarea
                                    value={formData.detail}
                                    onChange={(e) => setFormData({...formData, detail: e.target.value})}
                                    rows={3}
                                    placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                                />
                            </div>
                            <div className="form-group">
                                <label>รูปโปรไฟล์ (URL):</label>
                                <input
                                    type="url"
                                    value={formData.profile_img}
                                    onChange={(e) => setFormData({...formData, profile_img: e.target.value})}
                                    placeholder="https://example.com/profile.jpg"
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="submit" 
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving ? 'กำลังบันทึก...' : (editingDriver ? 'บันทึกการแก้ไข' : 'เพิ่มคนขับ')}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverPage;
