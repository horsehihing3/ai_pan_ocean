import api from './instance';

export const getVisitRequestsApi = () =>
  api.get('/visit-requests');

export const getVisitRequestApi = (id: string) =>
  api.get(`/visit-requests/${id}`);

export const createVisitRequestApi = (data: {
  title: string;
  vesselName?: string;
  location?: string;
  workStartDate: string;
  workEndDate: string;
  workerCount: number;
  workerList?: string[];
}) => api.post('/visit-requests', data);

export const updateVisitRequestApi = (id: string, data: {
  title?: string;
  vesselName?: string;
  location?: string;
  workStartDate?: string;
  workEndDate?: string;
  workerCount?: number;
  workerList?: string[];
}) => api.put(`/visit-requests/${id}`, data);

export const reviewVisitRequestApi = (id: string, data: {
  status: 'IMPROVEMENT_REQUESTED' | 'COMPLETED';
  note?: string;
}) => api.post(`/visit-requests/${id}/review`, data);
