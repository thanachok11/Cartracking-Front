import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ฟังก์ชันดึง user ทั้งหมด
export const fetchUsers = async (token: string) => {
    const res = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    // คืนค่า array ของ user
    return Array.isArray(res.data) ? res.data : res.data.users;
};

// ฟังก์ชันอัปเดต allowedPages ของ user
export const updateAllowedPages = async (
    token: string,
    userId: string,
    allowedPages: string[]
) => {
    const res = await axios.put(
        `${API_BASE_URL}/allowed-pages/update`,
        { targetUserId: userId, allowedPages },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
