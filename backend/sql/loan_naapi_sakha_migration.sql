-- ============================================================
-- Naapi Sakha Application (नापी शाखा निवेदन / जग्गा नक्सा) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loannaapisakhaapplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  RegisterNo VARCHAR(100) NULL,
  ChalaaniNo VARCHAR(100) NOT NULL,
  NaapiAddress VARCHAR(255) NULL,

  -- नक्सा विवरण
  Map1 VARCHAR(255) NULL,
  Map2 VARCHAR(255) NULL,
  LoanBhibhagPramukh VARCHAR(255) NULL,

  -- जग्गा विवरण (क.)
  LandHolderPersonName1 TEXT NULL,
  LandHolderFatherName1 VARCHAR(255) NULL,
  LandHolderGrandfatherName1 VARCHAR(255) NULL,
  LandAddress1 VARCHAR(255) NULL,
  LandWardNoBlockNo1 VARCHAR(100) NULL,
  LandKittaNo1 VARCHAR(100) NULL,
  LandArea1 VARCHAR(100) NULL,

  -- जग्गा विवरण (ख.)
  LandHolderPersonName2 TEXT NULL,
  LandHolderFatherName2 VARCHAR(255) NULL,
  LandHolderGrandfatherName2 VARCHAR(255) NULL,
  LandAddress2 VARCHAR(255) NULL,
  LandWardNoBlockNo2 VARCHAR(100) NULL,
  LandKittaNo2 VARCHAR(100) NULL,
  LandArea2 VARCHAR(100) NULL,

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
  ('loannaapi.view',    'View naapi sakha application'),
  ('loannaapi.create',  'Create naapi sakha application'),
  ('loannaapi.edit',    'Edit naapi sakha application'),
  ('loannaapi.approve', 'Verify/approve naapi sakha application'),
  ('loannaapi.delete',  'Delete naapi sakha application');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loannaapi.view', 'loannaapi.create', 'loannaapi.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loannaapi.view', 'loannaapi.create', 'loannaapi.edit', 'loannaapi.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loannaapi.view', 'loannaapi.create', 'loannaapi.edit', 'loannaapi.approve', 'loannaapi.delete');
