import { DataToday } from "../../../types/DataToday";

interface DataTableProps {
    rows: DataToday[];
    onEdit: (r: DataToday) => void;
    onDelete: (id?: string) => void;
    openOnMap: (station?: string) => void;
    ymdToDmy: (ymd?: string) => string;
}

export default function DataTable({ rows, onEdit, onDelete, openOnMap, ymdToDmy }: DataTableProps) {
    return (
        <div className="data-today-table-wrap">
            
            <table className="data-today-table">
                <thead>
                    <tr>
                        <th>เวลาเข้า</th>
                        <th>คนขับ</th>
                        <th>ทะเบียนหัว</th>
                        <th>ทะเบียนหาง</th>
                        <th>หมายเลขตู้</th>
                        <th>ตำแหน่ง</th>
                        <th>บริษัท</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r._id} className="data-today-row">
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
                                <button className="data-today-btn data-today-btn-small data-today-btn-edit" onClick={() => onEdit(r)}>
                                    แก้ไข
                                </button>
                                <button className="data-today-btn data-today-btn-small data-today-btn-danger" onClick={() => onDelete(r._id)}>
                                    ลบ
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
