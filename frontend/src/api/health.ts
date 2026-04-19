// [2026-04-19] 보건파트 API
import api from './instance';

export type HealthData = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  cholesterol?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  result?: string;
  [key: string]: unknown;
};

export const getHealthRecordsApi = (params?: { workerName?: string; bizNo?: string; year?: number }) =>
  api.get('/health', { params });

export const getHealthRecordApi = (id: string) => api.get(`/health/${id}`);

export const getWorkerHistoryApi = (id: string) => api.get(`/health/${id}/history`);

export const createHealthRecordApi = (data: {
  workerName: string; bizNo: string; checkupYear: number; data?: HealthData;
}) => api.post('/health', data);

export const updateHealthRecordApi = (id: string, data: {
  workerName?: string; bizNo?: string; checkupYear?: number; data?: HealthData;
}) => api.put(`/health/${id}`, data);

export const deleteHealthRecordApi = (id: string) => api.delete(`/health/${id}`);

export const addConsultationApi = (id: string, data: { date: string; content: string }) =>
  api.post(`/health/${id}/consultations`, data);

export const deleteConsultationApi = (id: string, consultationId: string) =>
  api.delete(`/health/${id}/consultations/${consultationId}`);

export const uploadHealthFileApi = (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/health/${id}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHealthFileUrlApi = (id: string) => api.get(`/health/${id}/file/download`);

export const deleteHealthFileApi = (id: string) => api.delete(`/health/${id}/file`);
