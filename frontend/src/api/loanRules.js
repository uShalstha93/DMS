import api from './axios';

export const loanRulesApi = {
  list: (params) => api.get('/loan-rules', { params }).then((r) => r.data.loanRules),
  stats: () => api.get('/loan-rules/stats').then((r) => r.data),
  members: () => api.get('/loan-rules/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-rules/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-rules/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-rules/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-rules/${id}`, values)
      : api.post('/loan-rules', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-rules/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-rules/${id}`).then((r) => r.data),
};

