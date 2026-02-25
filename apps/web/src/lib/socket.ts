import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token?: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const url = import.meta.env.VITE_API_URL || '';

  socket = io(url, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.debug('[socket] connected', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[socket] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.debug('[socket] connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
