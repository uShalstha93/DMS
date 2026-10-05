-- DMS full database setup: creates the database, all tables, roles, permissions and sample users.
-- Usage:  mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS dms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dms;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_no VARCHAR(40) NOT NULL UNIQUE,
  loan_account_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  loan_type VARCHAR(60) NOT NULL,
  loan_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NULL,
  tenure_months INT NULL,
  branch VARCHAR(100) NOT NULL,
  purpose VARCHAR(255) NULL,
  remarks TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_by INT NOT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_note VARCHAR(500) NULL,
  print_count INT NOT NULL DEFAULT 0,
  last_printed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS document_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(30) NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doc (document_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pair (sender_id, receiver_id),
  INDEX idx_receiver (receiver_id, read_at),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(150) NOT NULL,
  body VARCHAR(300) NULL,
  link VARCHAR(200) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


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
