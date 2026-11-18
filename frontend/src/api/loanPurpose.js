import api from './axios';

export const loanPurposeApi = {
  list: (params) =>
    api
      .get('/loan-purposes', { params })
      .then((r) => r.data.loanPurposes || r.data.data || r.data),
  stats: () => api.get('/loan-purposes/stats').then((r) => r.data),
  members: () => api.get('/loan-purposes/options/members').then((r) => r.data),
  loansForMember: (memberNo) =>
    api.get(`/loan-purposes/options/loans/${memberNo}`).then((r) => r.data),
  context: (memberNo, loanNo) =>
    api.get(`/loan-purposes/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-purposes/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-purposes/${id}`, values)
      : api.post('/loan-purposes', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-purposes/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-purposes/${id}`).then((r) => r.data),
};

export default loanPurposeApi;
