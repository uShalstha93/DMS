import api from './axios';

export const loanPratigyaApi = {
  list: (params) => api.get('/loan-pratigyas', { params }).then((r) => r.data.loanPratigyas),
  stats: () => api.get('/loan-pratigyas/stats').then((r) => r.data),
  members: () => api.get('/loan-pratigyas/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-pratigyas/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-pratigyas/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-pratigyas/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-pratigyas/${id}`, values)
      : api.post('/loan-pratigyas', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-pratigyas/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-pratigyas/${id}`).then((r) => r.data),
};

