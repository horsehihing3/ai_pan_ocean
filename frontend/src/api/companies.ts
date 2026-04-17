import api from './instance';

export const getCompaniesApi = () => api.get('/companies');

export const getCompanyApi = (id: string) => api.get(`/companies/${id}`);

export const toggleWatchlistApi = (id: string) => api.patch(`/companies/${id}/watchlist`);
