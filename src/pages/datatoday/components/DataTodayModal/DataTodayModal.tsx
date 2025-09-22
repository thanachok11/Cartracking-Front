import React from "react";
import DataTodayForm from "./DataTodayForm";
import DataTodayPreview from "./DataTodayPreview";
import { DataToday } from "../../../../types/DataToday";

interface DataTodayModalProps {
    show: boolean;
    editing: Partial<DataToday> | null;
    form: Partial<DataToday>;
    drivers: string[];
    truckHeadRegs: string[];
    truckTailRegs: string[];
    containerNumbers: string[];
    submitting: boolean;
    previewSrc: string | null;
    previewVisible: boolean;
    openPreviewFromUrl: (url: string) => void;
    openPreviewFromFile: (file: File) => void;
    closePreview: () => void;
    onChange: (k: keyof DataToday, v: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export default function DataTodayModal({
    show,
    editing,
    form,
    drivers,
    truckHeadRegs,
    truckTailRegs,
    containerNumbers,
    submitting,
    previewSrc,
    previewVisible,
    openPreviewFromUrl,
    openPreviewFromFile,
    closePreview,
    onChange,
    onSubmit,
    onCancel,
}: DataTodayModalProps) {
    if (!show) return null;

    return (
        <div className="data-today-modal-backdrop" onClick={onCancel}>
            <div
                className="data-today-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="data-today-modal-title">
                    {editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
                </h3>

                <DataTodayForm
                    editing={editing}
                    form={form}
                    drivers={drivers}
                    truckHeadRegs={truckHeadRegs}
                    truckTailRegs={truckTailRegs}
                    containerNumbers={containerNumbers}
                    submitting={submitting}
                    openPreviewFromUrl={openPreviewFromUrl}
                    openPreviewFromFile={openPreviewFromFile}
                    onChange={onChange}
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                />

                <DataTodayPreview
                    visible={previewVisible}
                    src={previewSrc}
                    onClose={closePreview}
                />
            </div>
        </div>
    );
}
