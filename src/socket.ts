import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from './constants';

let socket: Socket | null = null;

export function initSocket(token: string) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
