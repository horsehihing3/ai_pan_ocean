import api from './instance';

export const getSafetyRulesApi = (industry?: string) =>
  api.get('/safety-rules', { params: industry ? { industry } : {} });

export const getIndustriesApi = () => api.get('/safety-rules/industries');

export const createSafetyRuleApi = (data: {
  industry: string; title: string; content: string; order?: number;
}) => api.post('/safety-rules', data);

export const updateSafetyRuleApi = (id: string, data: {
  industry?: string; title?: string; content?: string; order?: number;
}) => api.put(`/safety-rules/${id}`, data);

export const deleteSafetyRuleApi = (id: string) => api.delete(`/safety-rules/${id}`);
