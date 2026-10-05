import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

// Loads the user with their permissions fresh from the DB,
// so permission changes apply immediately without re-login.
export async function loadUser(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_active, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const [perms] = await pool.query(
    `SELECT p.code FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ?`,
    [id]
  );
  return { ...rows[0], permissions: perms.map((p) => p.code) };
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await loadUser(id);
    if (!user || !user.is_active) return res.status(401).json({ message: 'Your account is not active' });
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
