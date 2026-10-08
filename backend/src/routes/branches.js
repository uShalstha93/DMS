import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('branch.manage'));

router.get('/', async (_req, res) => {
  const [branches] = await pool.query(
    `SELECT b.*, (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id) AS user_count
       FROM branches b ORDER BY b.code`
  );
  res.json({ branches });
});

router.post('/', async (req, res) => {
  const { code, name, address, phone } = req.body || {};
  if (!/^[A-Za-z0-9]{1,10}$/.test(code || '')) {
    return res.status(422).json({ message: 'Branch code must be 1 to 10 letters or numbers' });
  }
  if (!name?.trim()) return res.status(422).json({ message: 'Enter the branch name' });

  const [exists] = await pool.query('SELECT id FROM branches WHERE code = ?', [code]);
  if (exists[0]) return res.status(409).json({ message: 'A branch with this code already exists' });

  await pool.query('INSERT INTO branches (code, name, address, phone) VALUES (?, ?, ?, ?)', [
    code, name.trim(), address?.trim() || null, phone?.trim() || null,
  ]);
  res.status(201).json({ ok: true });
});

// The code cannot be changed: member numbers are built from it
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, address, phone, is_active } = req.body || {};

  if (is_active === false && id === req.user.branch.id) {
    return res.status(409).json({ message: 'You are signed in to this branch, so it cannot be switched off' });
  }
  if (name !== undefined) {
    if (!name.trim()) return res.status(422).json({ message: 'Enter the branch name' });
    await pool.query('UPDATE branches SET name = ? WHERE id = ?', [name.trim(), id]);
  }
  if (address !== undefined) await pool.query('UPDATE branches SET address = ? WHERE id = ?', [address?.trim() || null, id]);
  if (phone !== undefined) await pool.query('UPDATE branches SET phone = ? WHERE id = ?', [phone?.trim() || null, id]);
  if (is_active !== undefined) await pool.query('UPDATE branches SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
  res.json({ ok: true });
});

export default router;
