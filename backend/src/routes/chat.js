import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { emitToUser } from '../socket.js';

const router = Router();
router.use(authenticate, requirePermission('chat.use'));

// People you can chat with + unread counts
router.get('/users', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, r.name AS role,
            (SELECT COUNT(*) FROM messages m
              WHERE m.sender_id = u.id AND m.receiver_id = ? AND m.read_at IS NULL) AS unread
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id <> ? AND u.is_active = 1 ORDER BY u.name`,
    [req.user.id, req.user.id]
  );
  res.json({ users: rows });
});

router.get('/:userId', async (req, res) => {
  const other = Number(req.params.userId);
  const [rows] = await pool.query(
    `SELECT * FROM (
        SELECT * FROM messages
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY id DESC LIMIT 100
     ) t ORDER BY id ASC`,
    [req.user.id, other, other, req.user.id]
  );
  await pool.query('UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL', [other, req.user.id]);
  res.json({ messages: rows });
});

router.post('/:userId/read', async (req, res) => {
  await pool.query('UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL', [Number(req.params.userId), req.user.id]);
  res.json({ ok: true });
});

router.post('/:userId', async (req, res) => {
  const other = Number(req.params.userId);
  const body = req.body?.body?.trim();
  if (!body) return res.status(422).json({ message: 'Write a message first' });

  const [target] = await pool.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [other]);
  if (!target[0]) return res.status(404).json({ message: 'User not found' });

  const [result] = await pool.query('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)', [req.user.id, other, body]);
  const [[message]] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  emitToUser(other, 'chat:message', message);
  emitToUser(req.user.id, 'chat:message', message); // keeps the sender's other tabs in sync
  res.status(201).json({ message });
});

export default router;
