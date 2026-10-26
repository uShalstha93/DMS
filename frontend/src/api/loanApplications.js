import api from './axios';

export const loanApplicationsApi = {
  list: (params) => api.get('/loan-applications', { params }).then((r) => r.data.loanApplications),
  stats: () => api.get('/loan-applications/stats').then((r) => r.data),
  members: () => api.get('/loan-applications/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-applications/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-applications/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-applications/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-applications/${id}`, values)
      : api.post('/loan-applications', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-applications/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-applications/${id}`).then((r) => r.data),
};

