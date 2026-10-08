import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const canAccessAllBranches = (user) => user.permissions.includes('branch.access_all');

// Loads the user, their permissions and the branch they signed in to.
// Everything is read fresh from the DB on every request, so changes apply immediately.
// Returns null when the user may not work in that branch (wrong branch, or branch switched off).
export async function loadUser(id, branchId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_active, u.branch_id AS home_branch_id, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;

  const [perms] = await pool.query(
    `SELECT p.code FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ?`,
    [id]
  );
  const permissions = perms.map((p) => p.code);

  const [branches] = await pool.query('SELECT id, code, name, is_active FROM branches WHERE id = ?', [branchId]);
  const branch = branches[0];
  if (!branch || !branch.is_active) return null;
  if (row.home_branch_id !== branch.id && !permissions.includes('branch.access_all')) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    is_active: row.is_active,
    role: row.role,
    permissions,
    home_branch_id: row.home_branch_id,
    branch: { id: branch.id, code: branch.code, name: branch.name }, // the branch signed in to
  };
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue' });
  try {
    const { id, branchId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await loadUser(id, branchId); // tokens from before branches existed have no branchId and fail here
    if (!user || !user.is_active) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again' });
  }
}

export const requirePermission = (...codes) => (req, res, next) =>
  codes.some((c) => req.user.permissions.includes(c))
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do this' });
