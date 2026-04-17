import api from './instance';

export const getRegistrationsApi = (status?: string) =>
  api.get('/registration', { params: status ? { status } : {} });

export const approveRegistrationApi = (id: string) =>
  api.post(`/registration/${id}/approve`);

export const rejectRegistrationApi = (id: string, reason: string) =>
  api.post(`/registration/${id}/reject`, { reason });
