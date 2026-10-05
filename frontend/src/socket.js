import { io } from 'socket.io-client';
import { addNotification } from './store/notificationsSlice';
import { receiveMessage, setOnline, setTyping } from './store/chatSlice';
import { fetchDocuments, fetchStats } from './store/documentsSlice';

let socket = null;

export function connectSocket(token, dispatch) {
  disconnectSocket();
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { auth: { token } });

  socket.on('notification:new', (n) => {
    dispatch(addNotification(n));
    // A document event means lists and counts on screen may be stale
    if (n.type.startsWith('document.')) {
      dispatch(fetchDocuments());
      dispatch(fetchStats());
    }
  });
  socket.on('chat:message', (m) => dispatch(receiveMessage(m)));
  socket.on('presence:list', (ids) => dispatch(setOnline(ids)));
  socket.on('chat:typing', ({ from }) => dispatch(setTyping(from)));
}

export const emitTyping = (to) => socket?.emit('chat:typing', { to });

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
