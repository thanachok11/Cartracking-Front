import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faTrailer, faBuilding, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ITruckHead, ITruckTail } from "../../../api/components/truckApi";
import { useI18n } from "../../../i18n";

type Vehicle = ITruckHead | ITruckTail;

interface VehicleCardProps {
    truck: Vehicle;
    type: "head" | "tail"; // บอกว่าเป็น หัว หรือ ท้าย
    onEdit: (truck: Vehicle) => void;
    onDelete: (id: string) => void;
}

export default function VehicleCard({ truck, type, onEdit, onDelete }: VehicleCardProps) {
    const { t, lang } = useI18n();
    return (
        <div className="vehicle-card">
            <div className="card-header">
                <h3 className="vehicle-registration">
                    <FontAwesomeIcon
                        icon={type === "head" ? faTruck : faTrailer}
                        className="card-icon"
                    />
                    {truck.licensePlate}
                </h3>
                <div className="card-actions">
                    <button
                        className="edit-btn"
                        onClick={() => onEdit(truck)}
                        title={t('common.edit')}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(truck._id!)}
                        title={t('common.delete')}
                    >
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
                            : t('vehicles.company.rotruam')
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
    );
}
