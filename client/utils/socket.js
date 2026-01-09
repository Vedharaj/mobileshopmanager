import { io } from 'socket.io-client';
import { API_BASE } from '../store/api/axiosClient';

let socket;

export function getSocket() {
  try {
    if (socket && socket.connected) {
      return socket;
    }
    
    const base = (API_BASE || '').replace(/\/?api\/?$/, '');
    if (!base) {
      console.warn('⚠️ Socket: No API_BASE configured');
      return null;
    }
    
    socket = io(base, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error?.message);
    });

    return socket;
  } catch (e) {
    console.warn('⚠️ Socket init failed:', e?.message);
    return null;
  }
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (error) {
    console.warn('⚠️ Socket disconnect error:', error?.message);
  }
}

