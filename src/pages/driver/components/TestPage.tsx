import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // เปลี่ยนเป็น backend จริง

interface Driver {
    _id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    position: string;
    company: string;
    detail?: string;
    profile_img?: string;
}

export default function TestPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<Omit<Driver, '_id'>>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        position: '',
        company: '',
        detail: '',
        profile_img: '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // เปลี่ยนค่า input
    const handleChange = (key: keyof Omit<Driver, '_id'>, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    // เปลี่ยนไฟล์รูป
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(form.profile_img || null);
        }
    };

    // ส่งข้อมูลไป backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('firstName', form.firstName);
            formData.append('lastName', form.lastName);
            formData.append('phoneNumber', form.phoneNumber);
            formData.append('position', form.position);
            formData.append('company', form.company);
            if (form.detail) formData.append('detail', form.detail);
            if (file) formData.append('image', file); // ชื่อ field ต้องตรงกับ backend

            const response = await axios.post(`${API_BASE_URL}/driver/create`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // ❌ ไม่ต้องตั้ง Content-Type axios จะจัดให้เอง
                },
            });

            const newDriver: Driver = response.data.data;
            setDrivers((prev) => [...prev, newDriver]);

            // รีเซ็ต form
            setForm({
                firstName: '',
                lastName: '',
                phoneNumber: '',
                position: '',
                company: '',
                detail: '',
                profile_img: '',
            });
            setFile(null);
            setPreview(null);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create driver');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Test Page - Create Driver</h2>

            {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>ชื่อ:</label>
                    <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>นามสกุล:</label>
                    <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>เบอร์โทรศัพท์:</label>
                    <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(e) =>
                            handleChange('phoneNumber', e.target.value.replace(/\D/g, ''))
                        }
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        required
                    />
                </div>
                <div>
                    <label>ตำแหน่ง:</label>
                    <input
                        type="text"
                        value={form.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>บริษัท:</label>
                    <input
                        type="text"
                        value={form.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>รายละเอียด:</label>
                    <textarea
                        value={form.detail}
                        onChange={(e) => handleChange('detail', e.target.value)}
                        rows={3}
                    />
                </div>
                <div>
                    <label>รูปโปรไฟล์:</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    {preview && (
                        <div style={{ marginTop: 8 }}>
                            <img
                                src={preview}
                                alt="preview"
                                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                    )}
                </div>
                <div style={{ marginTop: 10 }}>
                    <button type="submit" disabled={saving}>
                        {saving ? 'กำลังบันทึก...' : 'สร้างคนขับ'}
                    </button>
                </div>
            </form>

            <h3>รายชื่อคนขับ</h3>
            <ul>
                {drivers.map((d) => (
                    <li key={d._id}>
                        {d.firstName} {d.lastName} - {d.company}
                        {d.profile_img && (
                            <img
                                src={d.profile_img}
                                alt="profile"
                                style={{ width: 50, height: 50, borderRadius: '50%', marginLeft: 8 }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
