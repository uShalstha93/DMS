import api from './axios';

export const loanManjurinaamaApi = {
  list: (params) => api.get('/loan-manjurinaamas', { params }).then((r) => r.data.loanManjurinaamas),
  stats: () => api.get('/loan-manjurinaamas/stats').then((r) => r.data),
  members: () => api.get('/loan-manjurinaamas/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-manjurinaamas/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-manjurinaamas/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-manjurinaamas/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-manjurinaamas/${id}`, values)
      : api.post('/loan-manjurinaamas', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-manjurinaamas/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-manjurinaamas/${id}`).then((r) => r.data),
};

