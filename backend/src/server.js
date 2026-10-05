import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initSocket } from './socket.js';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
initSocket(io);

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`DMS API running on http://localhost:${port}`));
