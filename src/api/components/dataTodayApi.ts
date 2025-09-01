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

export const createDataToday = async (payload: IDataTodayPayload): Promise<any> => {
  const url = `${base}/datatoday/create`;
  const res = await axios.post(url, payload, { headers: getAuthHeader(), withCredentials: true });
  return res.data;
};

export const updateDataToday = async (id: string, payload: Partial<IDataTodayPayload>): Promise<any> => {
  const url = `${base}/datatoday/update/${id}`;
  const res = await axios.patch(url, payload, { headers: getAuthHeader(), withCredentials: true });
  return res.data;
};

export const deleteDataToday = async (id: string): Promise<any> => {
  const url = `${base}/datatoday/delete/${id}`;
  const res = await axios.delete(url, { headers: getAuthHeader(), withCredentials: true });
  return res.data;
};
