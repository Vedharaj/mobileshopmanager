import axios from 'axios';

// Replace with your backend host. For emulator use 10.0.2.2 on Android emulator (not Expo Go),
// or your machine LAN IP (eg. http://192.168.x.x:5000) when testing on physical device.
const API = axios.create({
  baseURL: 'http://10.40.5.238:5000/api',
  timeout: 5000,
});

export default API;