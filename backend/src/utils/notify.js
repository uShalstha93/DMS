import { pool } from '../db.js';
import { emitToUser } from '../socket.js';

// Saves a notification for each user and pushes it live over socket.io.
export async function notify(userIds, options = {}) {
  // Support single-object signature: notify({ userId, type, title, body, message, link })
  if (!options || typeof options !== 'object' || Object.keys(options).length === 0) {
    if (userIds && typeof userIds === 'object' && !Array.isArray(userIds) && !(userIds instanceof Set)) {
      const single = userIds;
      const targetId = single.userId || single.user_id;
      options = {
        type: single.type,
        title: single.title,
        body: single.body || single.message || null,
        link: single.link || null,
      };
      userIds = targetId ? [targetId] : [];
    }
  }

  // Normalize userIds to iterable
  const ids = Array.isArray(userIds)
    ? userIds
    : userIds instanceof Set
    ? Array.from(userIds)
    : userIds
    ? [userIds]
    : [];

  const { type, title, body = null, message = null, link = null } = options || {};
  const notificationBody = body || message || null;

  for (const userId of new Set(ids)) {
    if (!userId) continue;
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, notificationBody, link]
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
