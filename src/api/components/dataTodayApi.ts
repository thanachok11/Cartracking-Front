import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token || ''}` };
};

export interface IDataTodayPayload {
  datetime_in: string;
  driver_name: string;
  head_registration: string;
  tail_registration: string;
  container_no: string;
  station_in: string;
  companyname: string;
  booking_id?: string;
  booking_image?: string;
}

const base = process.env.REACT_APP_API_URL || '';

export interface IDataTodayQuery {
  driver_name?: string;
  container_no?: string;
  from?: string; // yyyy-mm-dd or ISO
  to?: string; // yyyy-mm-dd or ISO
}

export const fetchAllDataToday = async (query?: IDataTodayQuery, signal?: AbortSignal): Promise<any[]> => {
  const url = `${base}/datatoday`;
  const res = await axios.get(url, {
    headers: getAuthHeader(),
    withCredentials: true,
    params: query,
    signal,
  });
  // backend may return array or object, normalize
  if (Array.isArray(res.data)) return res.data;
  return res.data?.data ?? [];
};

export const createDataToday = async (payload: IDataTodayPayload | FormData): Promise<any> => {
  const url = `${base}/datatoday/create`;
  
  // ตรวจสอบว่าเป็น FormData หรือไม่
  const isFormData = payload instanceof FormData;
  
  const config = {
    headers: {
      ...getAuthHeader(),
      // ถ้าเป็น FormData อย่าตั้ง Content-Type ให้ axios จัดการเอง
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    },
    withCredentials: true
  };
  
  console.log('🔍 Creating DataToday with payload:', payload);
  console.log('🔍 Is FormData:', isFormData);
  
  try {
    const res = await axios.post(url, payload, config);
    console.log('✅ DataToday created successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error creating DataToday:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

export const updateDataToday = async (id: string, payload: Partial<IDataTodayPayload> | FormData): Promise<any> => {
  const url = `${base}/datatoday/update/${id}`;
  
  // ตรวจสอบว่าเป็น FormData หรือไม่
  const isFormData = payload instanceof FormData;
  
  const config = {
    headers: {
      ...getAuthHeader(),
      // ถ้าเป็น FormData อย่าตั้ง Content-Type ให้ axios จัดการเอง
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    },
    withCredentials: true
  };
  
  console.log('🔍 Updating DataToday with payload:', payload);
  console.log('🔍 Is FormData:', isFormData);
  
  try {
    const res = await axios.patch(url, payload, config);
    console.log('✅ DataToday updated successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating DataToday:', error);
    console.error('❌ Error response:', error.response?.data);
    throw error;
  }
};

export const deleteDataToday = async (id: string): Promise<any> => {
  const url = `${base}/datatoday/delete/${id}`;
  const res = await axios.delete(url, { headers: getAuthHeader(), withCredentials: true });
  return res.data;
};
