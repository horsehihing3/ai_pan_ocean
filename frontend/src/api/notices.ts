import api from './instance';

export const getNoticesApi = () => api.get('/notices');

export const createNoticeApi = (data: { title: string; content: string; isPinned?: boolean }) =>
  api.post('/notices', data);

export const updateNoticeApi = (id: string, data: { title?: string; content?: string; isPinned?: boolean }) =>
  api.put(`/notices/${id}`, data);

export const deleteNoticeApi = (id: string) => api.delete(`/notices/${id}`);
