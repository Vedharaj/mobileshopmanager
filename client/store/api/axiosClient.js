import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://10.40.5.238:5000/api',
  timeout: 10000
});

// attach token if presentap
export const setAuthToken = async(token) => {
  if (token) await AsyncStorage.setItem("token", token);
  else await AsyncStorage.removeItem("token");
};

export default api