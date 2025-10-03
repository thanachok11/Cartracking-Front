import React from "react";
import { IWorkOrder } from "../../types/WorkOrder";
import WorkOrderPrint from "./WorkOrderPrint";
import { useI18n } from "../../i18n";

interface Props {
    orders: IWorkOrder[];
    locale: string;
    onEdit: (o: IWorkOrder) => void;
    onDelete: (id?: string) => void;
    onViewDescription: (desc: string) => void;
}

const WorkOrderTable: React.FC<Props> = ({ orders, locale, onEdit, onDelete, onViewDescription }) => {
    const { t } = useI18n();

    return (
        <table className="workorder-table">
            <thead>
                <tr>
                    <th>{t('workorder.table.issueDate')}</th>
                    <th>{t('workorder.table.number')}</th>
                    <th>{t('workorder.table.product')}</th>
                    <th>{t('workorder.table.driverName')}</th>
                    <th>{t('workorder.table.driverPhone')}</th>
                    <th>{t('workorder.table.headPlate')}</th>
                    <th>{t('workorder.table.tailPlate')}</th>
                    <th>{t('workorder.table.containerNumber')}</th>
                    <th>{t('workorder.table.companyName')}</th>
                    <th>{t('workorder.table.description')}</th>
                    <th>{t('workorder.table.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((o) => (
                    <tr key={o._id}>
                        <td>{new Date(o.issueDate).toLocaleDateString(locale)}</td>
                        <td>{o.workOrderNumber}</td>
                        <td>{o.product}</td>
                        <td>{o.driverName}</td>
                        <td>{o.driverPhone}</td>
                        <td>{o.headPlate}</td>
                        <td>{o.tailPlate}</td>
                        <td>{o.containerNumber}</td>
                        <td>{o.companyName}</td>
                        <td className="description-cell">
                            {o.description && o.description.length > 50 ? (
                                <>
                                    <div className="desc-text">{o.description.slice(0, 50) + "..."}</div>
                                    <button
                                        className="toggle-desc-btn"
                                        onClick={() => onViewDescription(o.description || "")}
                                    >
                                        {t('workorder.viewMore')}
                                    </button>
                                </>
                            ) : (
                                o.description || "-"
                            )}
                        </td>
                        <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="work-btn-edit" onClick={() => onEdit(o)}>
                                    {t('common.edit')}
                                </button>
                                <button className="work-btn-delete" onClick={() => onDelete(o._id)}>
                                    {t('common.delete')}
                                </button>
                                <WorkOrderPrint order={o} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default WorkOrderTable;
