-- ============================================================
-- Loan Detail Module Migration
-- Run this SQL on your lmsdata / dms database.
-- Safe to run more than once (INSERT IGNORE / IF NOT EXISTS).
-- ============================================================

-- 1. Add missing columns to loandetail (if they don't exist yet)
ALTER TABLE loandetail
  ADD COLUMN IF NOT EXISTS ApprovedStatus tinyint(1) DEFAULT 0 AFTER HasSakshi,
  ADD COLUMN IF NOT EXISTS ApprovedBy     varchar(255) DEFAULT NULL AFTER ApprovedStatus,
  ADD COLUMN IF NOT EXISTS CreatedBy      int          DEFAULT NULL AFTER ApprovedBy;

-- 2. Loan permissions
INSERT IGNORE INTO permissions (code, description) VALUES
  ('loan.view',    'View loan details'),
  ('loan.create',  'Enter new loan details'),
  ('loan.edit',    'Edit pending loan details'),
  ('loan.approve', 'Approve loan details'),
  ('loan.delete',  'Delete loan details');

-- 3. Assign loan permissions to existing roles
--    (Adjust role names to match what you have in your roles table)

-- Operator: can view and create
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loan.view', 'loan.create', 'loan.edit');

-- Admin: can view, create, edit and approve
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loan.view', 'loan.create', 'loan.edit', 'loan.approve');

-- Administrator: all loan permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loan.view', 'loan.create', 'loan.edit', 'loan.approve', 'loan.delete');

