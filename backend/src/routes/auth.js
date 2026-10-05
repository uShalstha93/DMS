import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password' });

  const [rows] = await pool.query('SELECT id, password_hash, is_active FROM users WHERE email = ?', [email.trim()]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (!row.is_active) return res.status(403).json({ message: 'Your account is disabled. Contact an administrator' });

  const token = jwt.sign({ id: row.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: await loadUser(row.id) });
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

export default router;
