import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useI18n } from "../../i18n";
import { downloadTemplate } from "../../api/components/orderApi";

const headerMapping: Record<string, string> = {
    "วันที่ออก": "issueDate", "วันที่": "issueDate", "วันที่ออกใบสั่ง": "issueDate",
    "issueDate": "issueDate", "日期": "issueDate", "出单日期": "issueDate",
    "เลขที่ใบสั่งงาน": "workOrderNumber", "เลขที่": "workOrderNumber",
    "workOrderNumber": "workOrderNumber", "订单号": "workOrderNumber", "工单号": "workOrderNumber",
    "สินค้า": "product", "product": "product", "产品": "product", "货物": "product",
    "ชื่อคนขับ": "driverName", "คนขับ": "driverName",
    "driverName": "driverName", "司机": "driverName", "驾驶员": "driverName",
    "เบอร์โทร": "driverPhone", "เบอร์โทรพนักงาน": "driverPhone",
    "driverPhone": "driverPhone", "电话": "driverPhone", "联系电话": "driverPhone",
    "ทะเบียนหัว": "headPlate", "headPlate": "headPlate", "车头牌照": "headPlate",
    "ทะเบียนหาง": "tailPlate", "tailPlate": "tailPlate", "车尾牌照": "tailPlate",
    "เลขตู้": "containerNumber", "หมายเลขตู้": "containerNumber",
    "containerNumber": "containerNumber", "集装箱号": "containerNumber",
    "บริษัท": "companyName", "เลือกบริษัท": "companyName",
    "companyName": "companyName", "公司": "companyName", "企业": "companyName",
    "รายละเอียด": "description", "description": "description",
    "备注": "description", "说明": "description",
};

interface Props {
    show: boolean;
    onClose: () => void;
    onConfirm: (rows: any[]) => void;
}

const WorkOrderImportModal: React.FC<Props> = ({ show, onClose, onConfirm }) => {
    const { t, lang } = useI18n();
    const [allData, setAllData] = useState<any[]>([]);
    const [error, setError] = useState<string>("");

    // Thai field names for display
    const fieldNamesThai: Record<string, string> = {
        "issueDate": "วันที่ออก",
        "workOrderNumber": "เลขที่ใบสั่งงาน",
        "product": "สินค้า", 
        "driverName": "คนขับ",
        "driverPhone": "เบอร์โทร",
        "headPlate": "ทะเบียนหัว",
        "tailPlate": "ทะเบียนหาง",
        "containerNumber": "เลขตู้",
        "companyName": "บริษัท",
        "description": "รายละเอียด",
    };

    if (!show) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setError("");

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!data) return;
            const workbook = XLSX.read(data, { type: "binary", cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false, dateNF: 'yyyy-mm-dd' });

            const normalized = json.map((row: any) => {
                const newRow: any = {};
                for (const key in row) {
                    const mapped = headerMapping[key.trim()];
                    if (mapped) {
                        let value = row[key];
                        
                        // จัดการวันที่ให้ถูกต้อง
                        if (mapped === 'issueDate' && value) {
                            if (value instanceof Date) {
                                // ถ้าเป็น Date object แล้ว
                                value = value.toISOString().split('T')[0];
                            } else if (typeof value === 'string' && value.trim()) {
                                // ถ้าเป็น string แล้วพยายามแปลงเป็นวันที่
                                const dateObj = new Date(value);
                                if (!isNaN(dateObj.getTime())) {
                                    value = dateObj.toISOString().split('T')[0];
                                }
                            }
                        }
                        
                        newRow[mapped] = value;
                    }
                }
                return newRow;
            });

            const requiredFields = [
                "issueDate", "workOrderNumber", "product", "driverName",
                "driverPhone", "headPlate", "tailPlate", "containerNumber", "companyName"
            ];

            const firstRowKeys = Object.keys(normalized[0] || {});
            const missing = requiredFields.filter(f => !firstRowKeys.includes(f));

            if (missing.length > 0) {
                const missingThaiNames = missing.map(field => fieldNamesThai[field] || field);
                setError(t("common.invalidHeader", { fields: missingThaiNames.join(", ") }));
                setAllData([]);
            } else {
                setAllData(normalized);
            }

        };
        reader.readAsBinaryString(file);
    };

    const handleConfirm = () => {
        if (allData.length === 0) {
            setError(t("common.noDataToImport"));
            return;
        }
        onConfirm(allData);
        onClose();
    };

    const handleDownloadTemplate = async (lang: "th" | "en" | "zh") => {
        try {
            await downloadTemplate(lang);
        } catch (err) {
            alert(t("common.downloadTemplateError")); 
        }
    };


    return (
        <div className="workorder-modal-backdrop">
            <div className="workorder-modal">
                <h3>{t("common.importPreview")}</h3>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />

                {error && (
                    <div className="wo-import-error-block">
                        <p className="wo-import-error-text">{error}</p>
                        <div className="wo-import-download-buttons">
                        {lang === "th" && (
                            <button onClick={() => handleDownloadTemplate("th")}>
                                {t("common.template")}
                            </button>
                        )}

                        {lang === "en" && (
                            <button onClick={() => handleDownloadTemplate("en")}>
                                {t("common.template")}
                            </button>
                        )}

                        {lang === "zh" && (
                            <button onClick={() => handleDownloadTemplate("zh")}>
                                {t("common.template")}
                            </button>
                        )}
                        </div>
                    </div>
                )}

                {allData.length > 0 && (
                    <div className="wo-import-preview-wrapper">
                        <div className="wo-import-stats">
                            <p>📊 ข้อมูลทั้งหมด: <strong>{allData.length}</strong> แถว</p>
                        </div>

                        <div className="wo-import-table-container">
                            <table className="wo-import-preview-table">
                                <thead>
                                    <tr>
                                        {Object.keys(allData[0] || {}).map((key, idx) => (
                                            <th key={idx}>{fieldNamesThai[key] || key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allData.map((row: any, i: number) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j}>{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <p className="wo-import-note">
                            💡 แสดงข้อมูลทั้งหมด {allData.length} แถว
                        </p>
                    </div>
                )}

                <div className="workorder-modal-actions">
                    <button type="button" onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button type="submit" onClick={handleConfirm}>
                        {t("common.confirmImport")}
                        {allData.length > 0 && ` (${allData.length} แถว)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderImportModal;
