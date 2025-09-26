import React from "react";
import { IWorkOrder } from "../../types/WorkOrder";

interface Props {
    order: IWorkOrder;
}

const WorkOrderPrint: React.FC<Props> = ({ order }) => {
    const handleExport = () => {
        // แปลงข้อมูลเป็นแนวตั้ง
        const rows = [
            ["เลขที่ใบสั่งงาน", order.workOrderNumber],
            ["สินค้า", order.product],
            ["พนักงานขับ", order.driverName],
            ["เบอร์โทร", order.driverPhone],
            ["ทะเบียนหัว", order.headPlate],
            ["ทะเบียนหาง", order.tailPlate],
            ["หมายเลขตู้", order.containerNumber],
            ["บริษัท", order.companyName],
            ["วันที่ออกใบสั่ง", new Date(order.issueDate).toLocaleDateString("th-TH")],
            ["แก้ไขล่าสุด", order.updatedAt ? new Date(order.updatedAt).toLocaleString("th-TH") : "-"],
            ["รายละเอียด", order.description || "-"],
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
            พิมพ์ CSV
        </button>
    );
};

export default WorkOrderPrint;
