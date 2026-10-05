// Creates the database, tables, roles, permissions and three starter users.
// Run once:  npm run db:setup
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.DB_NAME || 'dms';

const PERMISSIONS = {
  'document.create': 'Enter new loan documents',
  'document.view_all': 'See documents created by anyone',
  'document.approve': 'Approve or reject documents',
  'document.print': 'Print approved documents',
  'chat.use': 'Use chat',
  'user.manage': 'Manage users and roles',
};

const ROLES = {
  Operator: {
    description: 'Base user. Enters documents and prints own approved documents.',
    permissions: ['document.create', 'document.print', 'chat.use'],
  },
  Admin: {
    description: 'Verifies documents entered by operators.',
    permissions: ['document.view_all', 'document.approve', 'document.print', 'chat.use'],
  },
  Administrator: {
    description: 'Full access, including user management.',
    permissions: Object.keys(PERMISSIONS),
  },
};

const USERS = [
  { name: 'Olivia Operator', email: 'operator@dms.local', role: 'Operator' },
  { name: 'Adam Admin', email: 'admin@dms.local', role: 'Admin' },
  { name: 'Sam Administrator', email: 'administrator@dms.local', role: 'Administrator' },
];
const DEFAULT_PASSWORD = 'Password@123';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${DB}\``);
await conn.query(fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8'));

for (const [code, description] of Object.entries(PERMISSIONS)) {
  await conn.query('INSERT IGNORE INTO permissions (code, description) VALUES (?, ?)', [code, description]);
}
for (const [name, def] of Object.entries(ROLES)) {
  await conn.query('INSERT IGNORE INTO roles (name, description) VALUES (?, ?)', [name, def.description]);
  for (const code of def.permissions) {
    await conn.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = ? AND p.code = ?`,
      [name, code]
    );
  }
}

const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
for (const u of USERS) {
  await conn.query(
    `INSERT IGNORE INTO users (name, email, password_hash, role_id)
     SELECT ?, ?, ?, id FROM roles WHERE name = ?`,
    [u.name, u.email, hash, u.role]
  );
}

console.log('Database ready.');
console.log(`Sample logins (password: ${DEFAULT_PASSWORD}):`);
USERS.forEach((u) => console.log(`  ${u.role.padEnd(14)} ${u.email}`));
await conn.end();
