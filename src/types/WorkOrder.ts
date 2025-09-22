// ✅ Interface ของ WorkOrder (ตรงกับ backend)
export interface IWorkOrder {
    _id?: string;
    issueDate: string;           // วันที่ออกใบสั่ง
    workOrderNumber: string;     // เลขที่ใบสั่งงาน
    product: string;             // สินค้า
    driverName: string;          // พนักงานขับ
    driverPhone: string;         // เบอร์โทร
    headPlate: string;           // ทะเบียนหัว
    tailPlate: string;           // ทะเบียนหาง
    containerNumber: string;     // หมายเลขตู้
    companyName: string;             // บริษัท
    description?: string;        // รายละเอียด
    createdBy?: string;          // ผู้สร้าง
    createdAt?: string;
    updatedAt?: string;
}