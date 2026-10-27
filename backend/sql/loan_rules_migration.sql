-- ============================================================
-- Loan Rules (ऋणका शर्तहरु) Table & Permissions Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanrules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  LoanAmount VARCHAR(100) NULL,
  EntryDate VARCHAR(100) NULL,
  VisitDate VARCHAR(100) NULL,
  AdditionalIntRate VARCHAR(50) NULL,
  ChangeIntRate VARCHAR(50) NULL,
  Person2 VARCHAR(255) NULL,
  StaffID VARCHAR(100) NULL,
  StaffName VARCHAR(255) NULL,
  StaffPost VARCHAR(255) NULL,
  Remarks TEXT NULL,
  ApprovedStatus TINYINT(1) DEFAULT 0,
  ApprovedBy VARCHAR(255) NULL,
  ApprovedAt DATETIME NULL,
  BranchID VARCHAR(20) NULL,
  CreatedBy INT NULL,
  CreatedByName VARCHAR(255) NULL,
  Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member (MemberNo),
  INDEX idx_loan (LoanNo),
  INDEX idx_branch (BranchID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Permissions
INSERT IGNORE INTO permissions (code, description) VALUES
  ('loanrule.view',    'View loan rules conditions'),
  ('loanrule.create',  'Create loan rules conditions'),
  ('loanrule.edit',    'Edit loan rules conditions'),
  ('loanrule.approve', 'Verify/approve loan rules conditions'),
  ('loanrule.delete',  'Delete loan rules conditions');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanrule.view', 'loanrule.create', 'loanrule.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanrule.view', 'loanrule.create', 'loanrule.edit', 'loanrule.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanrule.view', 'loanrule.create', 'loanrule.edit', 'loanrule.approve', 'loanrule.delete');

