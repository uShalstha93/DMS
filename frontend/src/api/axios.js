import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8095/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or invalid token sends the person back to sign in.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const onLogin = window.location.pathname === '/login';
    if (error.response?.status === 401 && !onLogin) {
      localStorage.removeItem('dms_token');
      localStorage.removeItem('dms_user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = 'Something went wrong. Try again') =>
  error.response?.data?.message || fallback;

export default api;
