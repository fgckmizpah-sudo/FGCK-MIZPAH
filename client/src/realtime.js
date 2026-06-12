import { io as Client } from 'socket.io-client';
import client from './api';

const base = client.defaults.baseURL || window.location.origin;
const origin = base.replace(/\/api\/?$/, '');

const socket = Client(origin, { transports: ['websocket'], autoConnect: true });

socket.on('connect', () => {
  console.log('Realtime connected', socket.id);
});

socket.on('data-changed', (payload) => {
  // dispatch a global event components can listen to
  try {
    window.dispatchEvent(new CustomEvent('data-changed', { detail: payload }));
  } catch (e) {
    // ignore
  }
});

export default socket;
