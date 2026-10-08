import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

// Public: fills the branch dropdown on the login page
router.get('/branches', async (_req, res) => {
  const [branches] = await pool.query('SELECT id, code, name FROM branches WHERE is_active = 1 ORDER BY name');
  res.json({ branches });
});

router.post('/login', async (req, res) => {
  const { branch_id, email, password } = req.body || {};
  if (!branch_id) return res.status(400).json({ message: 'Choose your branch' });
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password' });

  const [rows] = await pool.query('SELECT id, password_hash, is_active FROM users WHERE email = ?', [email.trim()]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (!row.is_active) return res.status(403).json({ message: 'Your account is disabled. Contact an administrator' });

  // Password is right; now check the person may sign in to the branch they picked
  const user = await loadUser(row.id, Number(branch_id));
  if (!user) return res.status(403).json({ message: 'This account cannot sign in to the selected branch' });

  const token = jwt.sign({ id: row.id, branchId: user.branch.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  res.json({ token, user });
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

export default router;
