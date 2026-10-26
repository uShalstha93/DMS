import api from './axios';

export const organizationApi = {
  get: () => api.get('/organization').then((r) => r.data.organization),
  save: (formData) =>
    api
      .post('/organization', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export default organizationApi;
