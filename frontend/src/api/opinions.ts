// [2026-04-23] 근로자 의견조회 API
import api from './instance';

export const getMeProfileApi = () => api.get('/auth/me');

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
  writerName?: string;
  writerEmail?: string;
  writerPhone?: string;
  companyName?: string;
  industry?: string;
  file?: File | null;
}) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'file') {
      if (v) form.append('file', v as File);
    } else if (v !== undefined && v !== null) {
      form.append(k, String(v));
    }
  });
  return api.post('/opinions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// 협력업체: 전체 목록 조회
export const getOpinionsApi = (type?: OpinionType) =>
  api.get('/opinions/list', { params: type ? { type } : {} });

// 관리자: 전체 목록 조회
export const getAllOpinionsApi = (type?: OpinionType) =>
  api.get('/opinions', { params: type ? { type } : {} });

// 관리자: 답변 작성
export const replyOpinionApi = (id: string, adminReply: string) =>
  api.patch(`/opinions/${id}/reply`, { adminReply });
