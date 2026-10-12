import api from './axios';

// Members: list, view, save (create or edit), approve, delete.
// Photos are files, so the form is sent as multipart FormData.
function toFormData(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) data.append(key, value);
  });
  return data;
}

export const membersApi = {
  list: () => api.get('/members').then((r) => r.data.members),
  get: (memberNo) => api.get(`/members/${memberNo}`).then((r) => r.data.member),
  save: (values, memberNo) =>
    (memberNo ? api.put(`/members/${memberNo}`, toFormData(values)) : api.post('/members', toFormData(values))).then((r) => r.data.member),
  approve: (memberNo) => api.post(`/members/${memberNo}/approve`).then((r) => r.data.member),
  remove: (memberNo) => api.delete(`/members/${memberNo}`),
};

// Province / district / municipality options come from the localgovernments table
export const addressApi = {
  provinces: () => api.get('/address/provinces').then((r) => r.data.provinces),
  districts: (province) => api.get('/address/districts', { params: province ? { province } : {} }).then((r) => r.data.districts),
  municipalities: (province, district) =>
    api.get('/address/municipalities', { params: { province, district } }).then((r) => r.data.municipalities),
};
