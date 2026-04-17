import api from './instance';

export const getQuestionsApi = () => api.get('/semi-annual/questions');

export const getSemiAnnualsApi = () => api.get('/semi-annual');

export const getSemiAnnualApi = (id: string) => api.get(`/semi-annual/${id}`);

export const createSemiAnnualApi = (data: {
  year: number; half: number; content?: Record<string, string>; workerOpinion?: string;
}) => api.post('/semi-annual', data);

export const updateSemiAnnualApi = (id: string, data: {
  content?: Record<string, string>; workerOpinion?: string;
}) => api.put(`/semi-annual/${id}`, data);

export const submitSemiAnnualApi = (id: string) => api.post(`/semi-annual/${id}/submit`);

export const getSummaryApi = (year: number, half: number) =>
  api.get('/semi-annual/summary', { params: { year, half } });
