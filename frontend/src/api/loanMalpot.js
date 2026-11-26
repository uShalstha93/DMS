import api from './axios';

export const loanMalpotApi = {
  list: (params) =>
    api
      .get('/loan-malpot', { params })
      .then((r) => r.data.malpotApplications || r.data.data || r.data),
  stats: () => api.get('/loan-malpot/stats').then((r) => r.data),
  members: () => api.get('/loan-malpot/options/members').then((r) => r.data),
  loansForMember: (memberNo) =>
    api.get(`/loan-malpot/options/loans/${memberNo}`).then((r) => r.data),
  context: (memberNo, loanNo) =>
    api.get(`/loan-malpot/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-malpot/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-malpot/${id}`, values)
      : api.post('/loan-malpot', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-malpot/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-malpot/${id}`).then((r) => r.data),
};

export default loanMalpotApi;
