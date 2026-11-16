import api from './axios';

export const loanDhitoTamasukApi = {
  list: (params) =>
    api
      .get('/loan-dhito-tamasuk', { params })
      .then((r) => r.data.loanDhitoTamasuks || r.data.data || r.data),
  stats: () => api.get('/loan-dhito-tamasuk/stats').then((r) => r.data),
  members: () => api.get('/loan-dhito-tamasuk/options/members').then((r) => r.data.members),
  loansForMember: (memberNo) =>
    api.get(`/loan-dhito-tamasuk/options/loans/${memberNo}`).then((r) => r.data),
  context: (memberNo, loanNo) =>
    api.get(`/loan-dhito-tamasuk/context/${memberNo}/${loanNo}`).then((r) => r.data),
  get: (id) => api.get(`/loan-dhito-tamasuk/${id}`).then((r) => r.data),
  save: (values, id) =>
    (id
      ? api.put(`/loan-dhito-tamasuk/${id}`, values)
      : api.post('/loan-dhito-tamasuk', values)
    ).then((r) => r.data),
  approve: (id) => api.post(`/loan-dhito-tamasuk/${id}/approve`).then((r) => r.data),
  remove: (id) => api.delete(`/loan-dhito-tamasuk/${id}`).then((r) => r.data),
};

export default loanDhitoTamasukApi;
