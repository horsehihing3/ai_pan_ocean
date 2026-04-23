// [2026-04-23] 근로자 의견조회 API
import api from './instance';

export type OpinionType = 'NEAR_MISS' | 'ACCIDENT_REPORT' | 'GENERAL';

export const OPINION_TYPE_LABEL: Record<OpinionType, string> = {
  NEAR_MISS: '아차사고',
  ACCIDENT_REPORT: '산업재해조사표',
  GENERAL: '일반문의',
};

export const createOpinionApi = (data: {
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  consentAgreed: boolean;
}) => api.post('/opinions', data);

export const getMyOpinionsApi = () => api.get('/opinions/my');

export const getAllOpinionsApi = (type?: OpinionType) =>
  api.get('/opinions', { params: type ? { type } : {} });
