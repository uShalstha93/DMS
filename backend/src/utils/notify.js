import { pool } from '../db.js';
import { emitToUser } from '../socket.js';

// Saves a notification for each user and pushes it live over socket.io.
export async function notify(userIds, { type, title, body = null, link = null }) {
  for (const userId of new Set(userIds)) {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, body, link]
    );
    const [[row]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    emitToUser(userId, 'notification:new', row);
  }
}

export async function usersWithPermission(code, exceptUserId = 0) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE p.code = ? AND u.is_active = 1 AND u.id <> ?`,
    [code, exceptUserId]
  );
  return rows.map((r) => r.id);
}
