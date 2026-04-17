import api from './instance';

export const getInjuryTypesApi = () => api.get('/accidents/injury-types');

export const getAccidentsApi = (params?: { companyId?: string; year?: number; injuryType?: string }) =>
  api.get('/accidents', { params });

export const getAccidentApi = (id: string) => api.get(`/accidents/${id}`);

export const createAccidentApi = (data: {
  occurredAt: string; location?: string; description: string;
  workerName?: string; injuryType?: string; lostDays?: number;
}) => api.post('/accidents', data);

export const updateAccidentApi = (id: string, data: {
  occurredAt?: string; location?: string; description?: string;
  workerName?: string; injuryType?: string; lostDays?: number | null;
}) => api.put(`/accidents/${id}`, data);

export const deleteAccidentApi = (id: string) => api.delete(`/accidents/${id}`);

export const getAccidentStatsApi = (year: number) => api.get('/accidents/stats', { params: { year } });
