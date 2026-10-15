import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';
import branchRoutes from './routes/branches.js';
import staffRoutes from './routes/staff.js';
import memberRoutes from './routes/members.js';
import addressRoutes from './routes/address.js';
import loanRoutes from './routes/loans.js';
import loanRequestRoutes from './routes/loanRequests.js';
import { UPLOAD_ROOT } from './utils/uploads.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT)); // member photos and signatures

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/loan-requests', loanRequestRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server' });
});

export default app;
