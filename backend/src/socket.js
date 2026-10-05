import jwt from 'jsonwebtoken';

let io;
const online = new Map(); // userId -> open connection count

export function initSocket(server) {
  io = server;

  io.use((socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.userId = id;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const id = socket.userId;
    socket.join(`user:${id}`);
    online.set(id, (online.get(id) || 0) + 1);
    io.emit('presence:list', [...online.keys()]);

    // Typing indicator for one-to-one chat
    socket.on('chat:typing', ({ to }) => io.to(`user:${to}`).emit('chat:typing', { from: id }));

    socket.on('disconnect', () => {
      const left = (online.get(id) || 1) - 1;
      if (left <= 0) online.delete(id);
      else online.set(id, left);
      io.emit('presence:list', [...online.keys()]);
    });
  });
}

export const emitToUser = (userId, event, payload) => io?.to(`user:${userId}`).emit(event, payload);
