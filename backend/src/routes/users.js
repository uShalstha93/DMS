import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('user.manage'));

router.get('/', async (_req, res) => {
  const [users] = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_active, u.role_id, r.name AS role, u.created_at
       FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.id`
  );
  const [roles] = await pool.query('SELECT id, name, description FROM roles ORDER BY id');
  res.json({ users, roles });
});

router.post('/', async (req, res) => {
  const { name, email, password, role_id } = req.body || {};
  if (!name?.trim() || !email?.trim() || !role_id) return res.status(422).json({ message: 'Name, email and role are required' });
  if (!password || password.length < 8) return res.status(422).json({ message: 'Password must be at least 8 characters' });

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
  if (exists[0]) return res.status(409).json({ message: 'A user with this email already exists' });

  await pool.query('INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)', [
    name.trim(), email.trim(), await bcrypt.hash(password, 10), role_id,
  ]);
  res.status(201).json({ ok: true });
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { role_id, is_active } = req.body || {};
  if (id === req.user.id) return res.status(409).json({ message: 'You cannot change your own role or status' });
  if (role_id != null) await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, id]);
  if (is_active != null) await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
  res.json({ ok: true });
});

export default router;
