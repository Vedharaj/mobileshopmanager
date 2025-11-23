import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://192.168.31.67:5000/api',
  timeout: 10000
});

// attach token if present
export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

export default api;