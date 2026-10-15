import api from './axios';

export const loanRequestsApi = {
  list: (params) => api.get('/loan-requests', { params }).then((r) => r.data.loanRequests),
  stats: () => api.get('/loan-requests/stats').then((r) => r.data),
  members: () => api.get('/loan-requests/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-requests/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-requests/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-requests/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-requests/${id}`, values)
      : api.post('/loan-requests', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-requests/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-requests/${id}`).then((r) => r.data),
};

