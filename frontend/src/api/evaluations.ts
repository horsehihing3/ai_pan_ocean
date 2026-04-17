import api from './instance';

// 평가항목
export const getEvaluationItemsApi = () =>
  api.get('/evaluations/items');

export const createEvaluationItemApi = (data: {
  category: string; name: string; description?: string; maxScore?: number; order?: number;
}) => api.post('/evaluations/items', data);

export const updateEvaluationItemApi = (id: string, data: {
  category?: string; name?: string; description?: string; maxScore?: number; order?: number; isActive?: boolean;
}) => api.put(`/evaluations/items/${id}`, data);

// 평가
export const getEvaluationsApi = () =>
  api.get('/evaluations');

export const createEvaluationApi = (data: {
  companyId: string; year: number; half: number; overallResult: string;
  scores: { itemId: string; score: number; note?: string }[];
}) => api.post('/evaluations', data);

export const reviewEvaluationApi = (id: string, data: {
  status: 'IMPROVEMENT_REQUESTED' | 'COMPLETED'; note?: string;
}) => api.post(`/evaluations/${id}/review`, data);
