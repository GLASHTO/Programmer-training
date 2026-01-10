import axios from 'axios';
import useAuthStore from '../store/auth';

const api = axios.create({
  baseURL: 'http://10.25.2.4:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Требование: Authorization header добавлять только при /submit
  if (config.url && config.url.includes('/api/v1/games/submit')) {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;