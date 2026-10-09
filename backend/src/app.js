import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';
import branchRoutes from './routes/branches.js';
import staffRoutes from './routes/staff.js';
import addressRoutes from './routes/address.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/address', addressRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server' });
});

export default app;
