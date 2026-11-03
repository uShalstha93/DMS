-- ============================================================
-- Loan Pratigya (ऋणको प्रतिज्ञा पत्र) Table & Permissions Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanpratigyas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  RateOfInterest VARCHAR(50) NULL,
  Day1 VARCHAR(20) NULL,
  Day2 VARCHAR(20) NULL,
  AddInterest1 VARCHAR(20) NULL,
  Day3 VARCHAR(20) NULL,
  Day4 VARCHAR(20) NULL,
  AddInterest2 VARCHAR(20) NULL,
  Day5 VARCHAR(20) NULL,
  Day6 VARCHAR(20) NULL,
  AddInterest3 VARCHAR(20) NULL,
  KistaDay1 VARCHAR(20) NULL,
  Fine1 VARCHAR(20) NULL,
  KistaDay2 VARCHAR(20) NULL,
  Fine2 VARCHAR(20) NULL,
  KistaDay3 VARCHAR(20) NULL,
  Fine3 VARCHAR(20) NULL,
  ChangeableInterest VARCHAR(20) NULL,
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
  ('loanpratigya.view',    'View loan pratigya'),
  ('loanpratigya.create',  'Create loan pratigya'),
  ('loanpratigya.edit',    'Edit loan pratigya'),
  ('loanpratigya.approve', 'Verify/approve loan pratigya'),
  ('loanpratigya.delete',  'Delete loan pratigya');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanpratigya.view', 'loanpratigya.create', 'loanpratigya.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanpratigya.view', 'loanpratigya.create', 'loanpratigya.edit', 'loanpratigya.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanpratigya.view', 'loanpratigya.create', 'loanpratigya.edit', 'loanpratigya.approve', 'loanpratigya.delete');

