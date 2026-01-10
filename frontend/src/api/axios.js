import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: 'http://10.25.2.4:8000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;