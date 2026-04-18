import api from './instance';

export const getCategoriesApi = () => api.get('/performance/categories');

export const getPerformancesApi = (params?: { year?: number; month?: number; department?: string }) =>
  api.get('/performance', { params });

export const getSummaryApi = (year: number) =>
  api.get('/performance/summary', { params: { year } });

export const createPerformanceApi = (data: {
  year: number; month: number; department: string;
  category: string; value: number; note?: string;
}) => api.post('/performance', data);

export const updatePerformanceApi = (id: string, data: {
  year?: number; month?: number; department?: string;
  category?: string; value?: number; note?: string | null;
}) => api.put(`/performance/${id}`, data);

export const deletePerformanceApi = (id: string) => api.delete(`/performance/${id}`);
