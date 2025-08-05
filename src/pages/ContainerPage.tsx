import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    fetchAllContainers, 
    createContainer, 
    updateContainer, 
    deleteContainer, 
    isContainerNumberUnique,
    APIError,
    Containers,
    CONTAINER_SIZES 
} from '../api/components/containersApi';
import '../styles/pages/ContainerPage.css';

const ContainerPage: React.FC = () => {
    // Optimized state management
    const [containers, setContainers] = useState<Containers[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filterBy, setFilterBy] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingContainer, setEditingContainer] = useState<Containers | null>(null);
    const [saving, setSaving] = useState(false);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const [formData, setFormData] = useState<Omit<Containers, '_id'>>({
        containerNumber: '',
        companyName: '',
        containerSize: ''
    });

    // Memoized filtered containers for performance
    const filteredContainers = useMemo(() => {
        return containers.filter(container => {
            const containerNumber = container?.containerNumber || '';
            const companyName = container?.companyName || '';
            
            const searchMatch = containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               companyName.toLowerCase().includes(searchTerm.toLowerCase());
            
            let categoryMatch = true;
            if (filterBy === 'ป๋อเฉิน') {
                categoryMatch = companyName.includes('ป๋อเฉิน');
            } else if (filterBy === 'รถร่วม') {
                categoryMatch = companyName.includes('รถร่วม');
            }
            
            return searchMatch && categoryMatch;
        });
    }, [containers, searchTerm, filterBy]);

    // Optimized load function with retry
    const loadContainers = useCallback(async (retries = 3) => {
        try {
            setLoading(true);
            const containerData = await fetchAllContainers();
            setContainers(containerData);
            setError(null);
        } catch (error) {
            console.error(`❌ Load containers error (${4 - retries} attempt):`, error);
            
        } finally {
            setLoading(false);
        }
    }, []);

    // Optimized form handlers
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setEditingContainer(null);
        setError(null);
    }, []);

    const handleCreate = useCallback(async () => {
        try {
            setSaving(true);
            setError(null);

            const isUnique = await isContainerNumberUnique(formData.containerNumber!);
            if (!isUnique) {
                setError('Container Number already exists');
                return;
            }

            await createContainer(formData);
            await loadContainers();
            handleCloseModal();
        } catch (error) {
            setError(error instanceof APIError ? error.message : 'Failed to create container');
        } finally {
            setSaving(false);
        }
    }, [formData, loadContainers, handleCloseModal]);

    const handleUpdate = useCallback(async () => {
        if (!editingContainer) return;

        try {
            setSaving(true);
            setError(null);
            
            console.log('🔄 Starting container update:', {
                id: editingContainer._id,
                formData: formData
            });

            if (formData.containerNumber !== editingContainer.containerNumber) {
                console.log('🔍 Checking container number uniqueness...');
                const isUnique = await isContainerNumberUnique(formData.containerNumber!, editingContainer._id);
                if (!isUnique) {
                    setError('Container Number already exists');
                    return;
                }
            }

            console.log('✅ Container number is unique, proceeding with update...');
            const result = await updateContainer(editingContainer._id!, formData);
            console.log('✅ Container updated successfully:', result);
            
            await loadContainers();
            handleCloseModal();
        } catch (error: any) {
            console.error('❌ Update container error:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response,
                status: error?.response?.status,
                data: error?.response?.data
            });
            
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'Failed to update container';
            setError(`Update failed: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    }, [editingContainer, formData, loadContainers, handleCloseModal]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this container?')) return;

        try {
            await deleteContainer(id);
            await loadContainers();
        } catch (error) {
            setError(error instanceof APIError ? error.message : 'Failed to delete container');
        }
    }, [loadContainers]);

    const handleOpenModal = useCallback((container?: Containers) => {
        if (container) {
            setEditingContainer(container);
            setFormData({
                containerNumber: container.containerNumber || '',
                companyName: container.companyName || '',
                containerSize: container.containerSize || ''
            });
        } else {
            setEditingContainer(null);
            setFormData({
                containerNumber: '',
                companyName: '',
                containerSize: ''
            });
        }
        setShowModal(true);
    }, []);

    const handleSave = useCallback(() => {
        // Enhanced validation before submitting
        const trimmedContainerNumber = formData.containerNumber?.trim();
        
        if (!trimmedContainerNumber) {
            setError('Container Number is required');
            return;
        }
        
        // Validate container number format (optional - adjust as needed)
        if (trimmedContainerNumber.length < 3) {
            setError('Container Number must be at least 3 characters');
            return;
        }
        
        console.log('📝 Form validation passed, proceeding with save...');
        console.log('📋 Sending data:', {
            containerNumber: trimmedContainerNumber,
            companyName: formData.companyName?.trim() || '',
            containerSize: formData.containerSize?.trim() || ''
        });
        
        editingContainer ? handleUpdate() : handleCreate();
    }, [editingContainer, handleUpdate, handleCreate, formData]);


    // Load data on mount
    useEffect(() => {
        loadContainers();
    }, [loadContainers]);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container-page">
            {/* Header */}
            <div className="Container-header-row">
                <h2 className="section-title">Container Management</h2>
                <button 
                    className="add-container-button"
                    onClick={() => handleOpenModal()}
                >
                    + Add Container
                </button>
            </div>

            {/* Search & Filter */}
            <div className="search-container">
                <div className="search-and-sort">
                    <input
                        type="text"
                        placeholder="Search container number or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All</option>
                        <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                        <option value="รถร่วม">รถร่วม</option>
                    </select>
                </div>
                {(searchTerm || filterBy !== 'all') && (
                    <p className="search-results">
                        Found {filteredContainers.length} container(s)
                    </p>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-container">
                    <div className="error-message">
                        <h3>⚠️ Error</h3>
                        <p>{error}</p>
                        <div className="error-actions">
                            <button 
                                className="retry-button" 
                                onClick={() => {
                                    setError(null);
                                    loadContainers();
                                }}
                            >
                                🔄 Retry
                            </button>
                            <button 
                                className="dismiss-button" 
                                onClick={() => setError(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Network Diagnostic Display */}
            {showDiagnostic && (
                <div className="error-container">
                    <div className="error-message">
                        <button 
                            className="dismiss-button" 
                            onClick={() => setShowDiagnostic(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Container Grid */}
            <div className="grid-container">
                {filteredContainers.length === 0 ? (
                    <div className="no-results">
                        <h3>No containers found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    filteredContainers.map((container) => (
                        <div className="card" key={container._id}>
                            <h3>{container.containerNumber || 'N/A'}</h3>
                            <p><strong>Company:</strong> {container.companyName || 'N/A'}</p>
                            <p><strong>Size:</strong> {container.containerSize || 'N/A'}</p>
                            <div className="container-id">
                                ID: {container._id}
                            </div>
                            <div className="card-actions">
                                <button 
                                    className="btn-edit"
                                    onClick={() => handleOpenModal(container)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="btn-delete"
                                    onClick={() => handleDelete(container._id!)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingContainer ? 'Edit Container' : 'Add Container'}</h3>
                            <button className="btn-close" onClick={handleCloseModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div className="modal-error">
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Container Number:</label>
                                <input
                                    type="text"
                                    value={formData.containerNumber}
                                    onChange={(e) => setFormData({...formData, containerNumber: e.target.value})}
                                    placeholder="Enter container number"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Name:</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Container Size:</label>
                                <select
                                    value={formData.containerSize}
                                    onChange={(e) => setFormData({...formData, containerSize: e.target.value})}
                                >
                                    <option value="">Select container size</option>
                                    {CONTAINER_SIZES.map(size => (
                                        <option key={size.value} value={size.value}>
                                            {size.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button 
                                className="btn-save" 
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : (editingContainer ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContainerPage;
