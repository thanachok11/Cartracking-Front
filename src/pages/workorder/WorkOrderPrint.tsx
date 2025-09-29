import React, { useMemo } from "react";
import { IWorkOrder } from "../../types/WorkOrder";
import { useI18n } from "../../i18n";

interface Props {
    order: IWorkOrder;
}

const WorkOrderPrint: React.FC<Props> = ({ order }) => {
    const { t, lang } = useI18n();
    const locale = useMemo(() => (lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US'), [lang]);
    const handleExport = () => {
        // แปลงข้อมูลเป็นแนวตั้ง
        const rows = [
            [t('workorder.print.issueDate'), new Date(order.issueDate).toLocaleDateString(locale)],
            [t('workorder.print.number'), order.workOrderNumber],
            [t('workorder.print.product'), order.product],
            [t('workorder.print.driverName'), order.driverName],
            [t('workorder.print.driverPhone'), order.driverPhone],
            [t('workorder.print.headPlate'), order.headPlate],
            [t('workorder.print.tailPlate'), order.tailPlate],
            [t('workorder.print.containerNumber'), order.containerNumber],
            [t('workorder.print.companyName'), order.companyName],
            [t('workorder.print.description'), order.description || "-"],
        ];

        // ✅ ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
        const bom = "\uFEFF";
        const csvContent =
            bom +
            rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");

        // สร้างไฟล์ดาวน์โหลด
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `workorder_${order.workOrderNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button onClick={handleExport} className="work-btn-export">
            {t('workorder.print.download')}
        </button>
    );
};

export default WorkOrderPrint;
