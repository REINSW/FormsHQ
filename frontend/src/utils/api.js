import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fhq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fhq_token');
      localStorage.removeItem('fhq_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
