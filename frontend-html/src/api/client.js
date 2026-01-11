import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.25.2.4:8000',
  headers: { 'Content-Type': 'application/json' }
});

export default api;