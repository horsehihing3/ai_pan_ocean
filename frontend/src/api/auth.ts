import api from './instance';

export const loginApi = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const logoutApi = () =>
  api.post('/auth/logout');

export const getMeApi = () =>
  api.get('/auth/me');

export const submitRegistrationApi = (data: {
  companyName: string;
  bizNo: string;
  industry?: string;
  contractDept?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  password: string;
}) => api.post('/registration', data);
