-- ============================================================
-- Malpot Application (मालपोत निवेदन / दृष्टिबन्धक पास) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanmalpotapplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  RegisterNo VARCHAR(100) NULL,
  ChalaaniNo VARCHAR(100) NOT NULL,
  MalpotAddress VARCHAR(255) NULL,

  -- ऋणी तथा ऋण विवरण
  BorrowerName VARCHAR(255) NULL,
  SpouseName VARCHAR(255) NULL,
  LoanAmount VARCHAR(100) NULL,
  LoanAmountWords VARCHAR(255) NULL,
  StaffName VARCHAR(255) NULL,

  -- जग्गा विवरण (क.)
  LandHolderPersonNameAndAddress1 TEXT NULL,
  LandHolderFatherName1 VARCHAR(255) NULL,
  LandHolderGrandfatherName1 VARCHAR(255) NULL,
  LandAddress1 VARCHAR(255) NULL,
  LandWardNoBlockNo1 VARCHAR(100) NULL,
  LandKittaNo1 VARCHAR(100) NULL,
  LandArea1 VARCHAR(100) NULL,

  -- जग्गा विवरण (ख.)
  LandHolderPersonNameAndAddress2 TEXT NULL,
  LandHolderFatherName2 VARCHAR(255) NULL,
  LandHolderGrandfatherName2 VARCHAR(255) NULL,
  LandAddress2 VARCHAR(255) NULL,
  LandWardNoBlockNo2 VARCHAR(100) NULL,
  LandKittaNo2 VARCHAR(100) NULL,
  LandArea2 VARCHAR(100) NULL,

  -- प्रतिनिधिको विवरण
  PratinidhiName VARCHAR(255) NULL,
  PratinidhiAddress VARCHAR(255) NULL,
  PratinidhiCitNo VARCHAR(100) NULL,
  PratinidhiCitIssuedDateAndPlace VARCHAR(255) NULL,

  -- Approval & Branch Audit
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
  ('loanmalpot.view',    'View malpot application'),
  ('loanmalpot.create',  'Create malpot application'),
  ('loanmalpot.edit',    'Edit malpot application'),
  ('loanmalpot.approve', 'Verify/approve malpot application'),
  ('loanmalpot.delete',  'Delete malpot application');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanmalpot.view', 'loanmalpot.create', 'loanmalpot.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanmalpot.view', 'loanmalpot.create', 'loanmalpot.edit', 'loanmalpot.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanmalpot.view', 'loanmalpot.create', 'loanmalpot.edit', 'loanmalpot.approve', 'loanmalpot.delete');
