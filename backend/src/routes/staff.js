import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

const SELECT = `
  SELECT s.*, b.name AS branch_name, b.code AS branch_code
    FROM staffs s JOIN branches b ON b.id = s.branch_id`;

// Staff of the branch you signed in to; people with branch.access_all see every branch
const inScope = (user, staff) => canAccessAllBranches(user) || staff.branch_id === user.branch.id;

async function getStaff(staffno) {
  const [rows] = await pool.query(`${SELECT} WHERE s.staffno = ?`, [staffno]);
  return rows[0];
}

const FIELDS = ['name', 'name_eng', 'post', 'mobileno', 'email', 'address'];

function clean(body = {}) {
  const v = {};
  FIELDS.forEach((k) => { v[k] = typeof body[k] === 'string' ? body[k].trim() : ''; });
  return v;
}

function validate(v) {
  const errors = {};
  if (!v.name) errors.name = 'Enter the name';
  if (!v.name_eng) errors.name_eng = 'Enter the name in English';
  if (!v.post) errors.post = 'Enter the post';
  // digits may be English (0-9) or Nepali (०-९)
  if (!/^[0-9०-९+\-\s]{7,20}$/.test(v.mobileno)) errors.mobileno = 'Enter a valid mobile number';
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'Enter a valid email';
  return errors;
}

router.get('/', requirePermission('staff.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (!canAccessAllBranches(req.user)) { where.push('s.branch_id = ?'); params.push(req.user.branch.id); }
  const [rows] = await pool.query(
    `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.branch_id, s.staffno`,
    params
  );
  res.json({ staff: rows });
}));

router.get('/:staffno', requirePermission('staff.view'), wrap(async (req, res) => {
  const staff = await getStaff(req.params.staffno);
  if (!staff || !inScope(req.user, staff)) return res.status(404).json({ message: 'Staff not found' });
  res.json({ staff });
}));

// Staff number = 2-digit branch id + "ST" + running 4-digit number, e.g. 01ST0007
router.post('/', requirePermission('staff.manage'), wrap(async (req, res) => {
  const v = clean(req.body);
  const errors = validate(v);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  // New staff go to the branch you signed in to; people who work in every branch may pick one
  let branchId = req.user.branch.id;
  if (canAccessAllBranches(req.user) && req.body.branch_id) {
    const [b] = await pool.query('SELECT id FROM branches WHERE id = ? AND is_active = 1', [Number(req.body.branch_id)]);
    if (!b[0]) return res.status(422).json({ message: 'Choose an active branch' });
    branchId = b[0].id;
  }

  const prefix = `${String(branchId).padStart(2, '0')}ST`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [[{ last }]] = await pool.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(staffno, ?) AS UNSIGNED)), 0) AS last FROM staffs WHERE staffno LIKE ?',
      [prefix.length + 1, `${prefix}%`]
    );
    const staffno = `${prefix}${String(last + 1).padStart(4, '0')}`;
    try {
      await pool.query(
        'INSERT INTO staffs (staffno, name, name_eng, post, mobileno, email, address, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [staffno, v.name, v.name_eng, v.post, v.mobileno, v.email || null, v.address || null, branchId]
      );
      return res.status(201).json({ staff: await getStaff(staffno) });
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e; // two people saved at once: try the next number
    }
  }
  res.status(409).json({ message: 'Could not create a staff number. Try again' });
}));

// The staff number and branch never change
router.put('/:staffno', requirePermission('staff.manage'), wrap(async (req, res) => {
  const staff = await getStaff(req.params.staffno);
  if (!staff || !inScope(req.user, staff)) return res.status(404).json({ message: 'Staff not found' });

  const v = clean(req.body);
  const errors = validate(v);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  await pool.query(
    'UPDATE staffs SET name=?, name_eng=?, post=?, mobileno=?, email=?, address=? WHERE staffno=?',
    [v.name, v.name_eng, v.post, v.mobileno, v.email || null, v.address || null, staff.staffno]
  );
  res.json({ staff: await getStaff(staff.staffno) });
}));

router.delete('/:staffno', requirePermission('staff.manage'), wrap(async (req, res) => {
  const staff = await getStaff(req.params.staffno);
  if (!staff || !inScope(req.user, staff)) return res.status(404).json({ message: 'Staff not found' });
  await pool.query('DELETE FROM staffs WHERE staffno = ?', [staff.staffno]);
  res.json({ ok: true });
}));

export default router;
