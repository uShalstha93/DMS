import api from './axios';

export const loanPariwarikSwikritiApi = {
  list: (params) => api.get('/loan-pariwarik-swikriti', { params }).then((r) => r.data.loanPariwarikSwikritis),
  stats: () => api.get('/loan-pariwarik-swikriti/stats').then((r) => r.data),
  members: () => api.get('/loan-pariwarik-swikriti/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) => api.get(`/loan-pariwarik-swikriti/options/loans/${memberNo}`).then((r) => r.data.loans),
  context: (memberNo, loanNo) => api.get(`/loan-pariwarik-swikriti/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-pariwarik-swikriti/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-pariwarik-swikriti/${id}`, values)
      : api.post('/loan-pariwarik-swikriti', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-pariwarik-swikriti/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-pariwarik-swikriti/${id}`).then((r) => r.data),
};

