-- ============================================================
-- Loan Application (कर्जा प्रस्ताव) Table & Permissions Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanapplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  RateOfInterest VARCHAR(100) NULL,
  MeetingNo VARCHAR(100) NULL,
  LoanAmount VARCHAR(100) NULL,
  StaffPost VARCHAR(255) NULL,
  StaffName VARCHAR(255) NULL,
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
  ('loanapplication.view',    'View loan application proposals'),
  ('loanapplication.create',  'Create loan application proposals'),
  ('loanapplication.edit',    'Edit loan application proposals'),
  ('loanapplication.approve', 'Verify/approve loan application proposals'),
  ('loanapplication.delete',  'Delete loan application proposals');

-- Assign permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanapplication.view', 'loanapplication.create', 'loanapplication.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanapplication.view', 'loanapplication.create', 'loanapplication.edit', 'loanapplication.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanapplication.view', 'loanapplication.create', 'loanapplication.edit', 'loanapplication.approve', 'loanapplication.delete');

