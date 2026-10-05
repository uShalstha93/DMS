-- Roles, permissions and sample users for DMS.
-- Safe to run more than once (INSERT IGNORE).
-- All sample users have the password:  Password@123

USE dms;

-- ---------- Permissions ----------
INSERT IGNORE INTO permissions (code, description) VALUES
  ('document.create',   'Enter new loan documents'),
  ('document.view_all', 'See documents created by anyone'),
  ('document.approve',  'Approve or reject documents'),
  ('document.print',    'Print approved documents'),
  ('chat.use',          'Use chat'),
  ('user.manage',       'Manage users and roles');

-- ---------- Roles ----------
INSERT IGNORE INTO roles (name, description) VALUES
  ('Operator',      'Base user. Enters documents and prints own approved documents.'),
  ('Admin',         'Verifies documents entered by operators.'),
  ('Administrator', 'Full access, including user management.');

-- ---------- Role -> permission mapping ----------
-- Operator
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.name = 'Operator'
   AND p.code IN ('document.create', 'document.print', 'chat.use');

-- Admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.name = 'Admin'
   AND p.code IN ('document.view_all', 'document.approve', 'document.print', 'chat.use');

-- Administrator (everything)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.name = 'Administrator';

-- ---------- Sample users (password: Password@123) ----------
INSERT IGNORE INTO users (name, email, password_hash, role_id)
SELECT 'Olivia Operator', 'operator@dms.local', '$2b$10$Xo4PXryiuV7fAahUrdIOs.kc39pj1FIc/rwAHoXywKWJAqOv317cK', id FROM roles WHERE name = 'Operator';

INSERT IGNORE INTO users (name, email, password_hash, role_id)
SELECT 'Adam Admin', 'admin@dms.local', '$2b$10$Xo4PXryiuV7fAahUrdIOs.kc39pj1FIc/rwAHoXywKWJAqOv317cK', id FROM roles WHERE name = 'Admin';

INSERT IGNORE INTO users (name, email, password_hash, role_id)
SELECT 'Sam Administrator', 'administrator@dms.local', '$2b$10$Xo4PXryiuV7fAahUrdIOs.kc39pj1FIc/rwAHoXywKWJAqOv317cK', id FROM roles WHERE name = 'Administrator';
