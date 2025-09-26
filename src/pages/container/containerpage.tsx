import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./components/ContainerPage.css";
import "./components/ContainerModal.css";
import {
  fetchAllContainers,
  createContainer,
  updateContainer,
  deleteContainer,
  isContainerNumberUnique,
  APIError,
  CONTAINER_SIZES,
  Containers as ApiContainers,
} from "../../api/components/containersApi";
import { Containers } from "./components/types";
import { validateForm, ensureTrim } from "./components/utils";
import ContainerHeader from "./components/ContainerHeader";
import ContainerGrid from "./components/ContainerGrid";
import ContainerModal from "./components/ContainerModal";
import { useNotification } from "../../hooks/useNotification";
import NotificationToast from "../../components/common/NotificationToast";

export default function ContainerPage() {
  const [containers, setContainers] = useState<Containers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Containers | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Containers, "_id">>({
    containerNumber: "",
    companyName: "",
    containerSize: "",
  });

  const { notification, progress, showNotification, handleMouseEnter, handleMouseLeave } = useNotification();

  const filteredContainers = useMemo(
    () =>
      containers.filter((c) => {
        const containerNumber = c?.containerNumber || "";
        const companyName = c?.companyName || "";
        const searchMatch =
          containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          companyName.toLowerCase().includes(searchTerm.toLowerCase());
        let categoryMatch = true;
        if (filterBy === "ป๋อเฉิน") categoryMatch = companyName.includes("ป๋อเฉิน");
        else if (filterBy === "บริษัทร่วม") categoryMatch = companyName.includes("บริษัทร่วม");
        return searchMatch && categoryMatch;
      }),
    [containers, searchTerm, filterBy]
  );

  const loadContainers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllContainers();
      setContainers(data as ApiContainers[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingContainer(null);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      setSaving(true);
      const val = validateForm(formData);
      if (val) return alert(val);

      const isUnique = await isContainerNumberUnique(ensureTrim(formData.containerNumber!));
      if (!isUnique) return alert("Container Number already exists");

      await createContainer({ ...formData, containerNumber: ensureTrim(formData.containerNumber) });
      await loadContainers();
      handleCloseModal();
      showNotification("เพิ่มคอนเทนเนอร์สำเร็จ! ✅", "success");
    } catch (err) {
      alert(err instanceof APIError ? err.message : "Failed to create container");
      showNotification("เกิดข้อผิดพลาดในการเพิ่มคอนเทนเนอร์ ❌", "error");
    } finally {
      setSaving(false);
    }
  }, [formData, loadContainers, handleCloseModal]);

  const handleUpdate = useCallback(async () => {
    if (!editingContainer) return;
    try {
      setSaving(true);
      const val = validateForm(formData);
      if (val) return alert(val);

      await updateContainer(editingContainer._id!, {
        ...formData,
        containerNumber: ensureTrim(formData.containerNumber),
      });
      await loadContainers();
      handleCloseModal();
      showNotification("แก้ไขคอนเทนเนอร์สำเร็จ! ✅", "success");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Failed to update container");
      showNotification("เกิดข้อผิดพลาดในการแก้ไขคอนเทนเนอร์ ❌", "error");
    } finally {
      setSaving(false);
    }
  }, [editingContainer, formData, loadContainers, handleCloseModal]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบตู้คอนเทนเนอร์นี้?")) return;
      try {
        await deleteContainer(id);
        await loadContainers();
        showNotification("ลบคอนเทนเนอร์สำเร็จ! ✅", "success");
      } catch (err) {
        showNotification("เกิดข้อผิดพลาดในการลบคอนเทนเนอร์ ❌", "error");
      }
    },
    [loadContainers]
  );

  const handleOpenModal = useCallback((container?: Containers) => {
    if (container) {
      setEditingContainer(container);
      setFormData({
        containerNumber: container.containerNumber || "",
        companyName: container.companyName || "",
        containerSize: container.containerSize || "",
      });
    } else {
      setEditingContainer(null);
      setFormData({ containerNumber: "", companyName: "", containerSize: "" });
    }
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    editingContainer ? handleUpdate() : handleCreate();
  }, [editingContainer, handleUpdate, handleCreate]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  if (loading) return <div className="loading">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="container-page">
      <ContainerHeader
        onRefresh={loadContainers}
        onAdd={() => handleOpenModal()}
        totalCount={containers.length}
        resultsCount={filteredContainers.length}
        searchTerm={searchTerm}
        filterBy={filterBy}
        onSearch={setSearchTerm}
        onFilter={setFilterBy}
      />

      <ContainerGrid items={filteredContainers} onEdit={handleOpenModal} onDelete={handleDelete} />

      <ContainerModal
        visible={showModal}
        editing={editingContainer}
        error={null}
        saving={saving}
        form={formData}
        sizes={CONTAINER_SIZES}
        onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <NotificationToast
        message={notification?.message}
        type={notification?.type}
        progress={progress}
        isHovering={false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
