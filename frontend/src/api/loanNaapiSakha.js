import api from './axios';

export const loanNaapiSakhaApi = {
  list: (params) =>
    api
      .get('/loan-naapi-sakha', { params })
      .then((r) => r.data.naapiApplications || r.data.data || r.data),
  stats: () => api.get('/loan-naapi-sakha/stats').then((r) => r.data),
  members: () => api.get('/loan-naapi-sakha/options/members').then((r) => r.data),
  loansForMember: (memberNo) =>
    api.get(`/loan-naapi-sakha/options/loans/${memberNo}`).then((r) => r.data),
  context: (memberNo, loanNo) =>
    api.get(`/loan-naapi-sakha/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-naapi-sakha/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-naapi-sakha/${id}`, values)
      : api.post('/loan-naapi-sakha', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-naapi-sakha/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-naapi-sakha/${id}`).then((r) => r.data),
};

export default loanNaapiSakhaApi;
