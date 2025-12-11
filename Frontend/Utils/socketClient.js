// WebSocket client utilities
import io from 'socket.io-client';

let socket = null;

export const initSocket = (url) => {
  socket = io(url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
