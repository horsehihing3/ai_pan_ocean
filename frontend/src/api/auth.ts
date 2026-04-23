import api from './instance';

export const loginApi = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const logoutApi = () =>
  api.post('/auth/logout');

export const getMeApi = () =>
  api.get('/auth/me');

export const submitRegistrationApi = (data: {
  companyName: string;
  companyNameEn?: string;
  bizNo: string;
  companyPhone?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  industry?: string;
  industryEtc?: string;
  contractDept?: string;
  applicantName: string;
  applicantTitle?: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantContactEmail?: string;
  password: string;
  bizFile?: File | null;
}) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'bizFile') return;
    if (value != null && value !== '') fd.append(key, String(value));
  });
  if (data.bizFile) fd.append('bizFile', data.bizFile);
  return api.post('/registration', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
