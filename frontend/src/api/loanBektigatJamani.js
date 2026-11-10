import api from './axios';

export const loanBektigatJamaniApi = {
  list: (params) => api.get('/loan-bektigat-jamani', { params }).then((r) => r.data.loanBektigatJamanis),
  stats: () => api.get('/loan-bektigat-jamani/stats').then((r) => r.data),
  members: () => api.get('/loan-bektigat-jamani/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-bektigat-jamani/options/loans/${memberNo}`).then((r) => r.data),
  context: (memberNo, loanNo) => api.get(`/loan-bektigat-jamani/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-bektigat-jamani/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-bektigat-jamani/${id}`, values)
      : api.post('/loan-bektigat-jamani', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-bektigat-jamani/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-bektigat-jamani/${id}`).then((r) => r.data),
};
