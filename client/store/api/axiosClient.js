import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const fallbackBase = 'http://10.19.117.238:5000/api';
// const API_BASE = (ENV_API_BASE_URL && ENV_API_BASE_URL.trim()) || fallbackBase;
const API_BASE = fallbackBase;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000 // Increased to 30 seconds for large imports
});

// Add request interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    // console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // console.log(`✅ API Response: ${response.status}`);
    return response;
  },
  (error) => {
    // if (error.response) {
    //   console.error(`❌ API Error: ${error.response.status}`, error.response.data);
    // } else if (error.request) {
    //   console.error('❌ No response from server');
    //   console.error('❌ Check: Is server running? Is URL correct?');
    //   console.error('❌ BaseURL:', error.config?.baseURL);
    // } else {
    //   console.error('❌ Request setup error:', error.message);
    // }
    return Promise.reject(error);
  }
);

// attach token if present
export const setAuthToken = async(token) => {
  if (token) await AsyncStorage.setItem("token", token);
  else await AsyncStorage.removeItem("token");
};

export { API_BASE };
export default api