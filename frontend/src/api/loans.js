import api from './axios';

export const loansApi = {
  list: (params) => api.get('/loans', { params }).then((r) => r.data.loans),
  stats: () => api.get('/loans/stats').then((r) => r.data),
  get: (loanNo) => api.get(`/loans/${loanNo}`).then((r) => r.data.loan),
  save: (values, loanNo) =>
    (loanNo
      ? api.put(`/loans/${loanNo}`, values)
      : api.post('/loans', values)
    ).then((r) => r.data.loan),
  approve: (loanNo) => api.post(`/loans/${loanNo}/approve`).then((r) => r.data.loan),
  remove: (loanNo) => api.delete(`/loans/${loanNo}`),
};

