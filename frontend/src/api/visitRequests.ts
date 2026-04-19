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

// [2026-04-19] 서류 업로드·다운로드·삭제
export const uploadDocumentApi = (id: string, type: string, file: File) => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);
  return api.post(`/visit-requests/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDocumentUrlApi = (id: string, docId: string) =>
  api.get(`/visit-requests/${id}/documents/${docId}/download`);

export const deleteDocumentApi = (id: string, docId: string) =>
  api.delete(`/visit-requests/${id}/documents/${docId}`);
