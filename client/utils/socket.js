import { io } from 'socket.io-client';
import { API_BASE } from '../store/api/axiosClient';

let socket;

export function getSocket() {
  if (socket) return socket;
  try {
    const base = (API_BASE || '').replace(/\/?api\/?$/, '');
    socket = io(base, {
      transports: ['websocket'],
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Socket init failed', e?.message);
  }
  return socket;
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect();
      socket = undefined;
    }
  } catch {}
}
