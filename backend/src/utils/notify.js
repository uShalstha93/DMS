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

// Users who hold a permission. With a branchId, only people from that branch
// (or people who may work in every branch) are returned.
export async function usersWithPermission(code, exceptUserId = 0, branchId = null) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE p.code = ? AND u.is_active = 1 AND u.id <> ?
        AND (? IS NULL OR u.branch_id = ? OR EXISTS (
              SELECT 1 FROM role_permissions rp2
                JOIN permissions p2 ON p2.id = rp2.permission_id
               WHERE rp2.role_id = u.role_id AND p2.code = 'branch.access_all'))`,
    [code, exceptUserId, branchId, branchId]
  );
  return rows.map((r) => r.id);
}
