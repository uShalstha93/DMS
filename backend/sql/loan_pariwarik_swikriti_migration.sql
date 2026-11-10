-- ============================================================
-- Loan Pariwarik Swikriti (पारिवारिक स्वीकृति) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanpariwarikswikritis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  
  -- पारिवारिक स्वीकृति दिने नातेदार विवरण
  RelativeGrandfatherName VARCHAR(255) NULL,
  RelativeFatherName VARCHAR(255) NULL,
  RelativeSpouseName VARCHAR(255) NULL,
  RelativeName VARCHAR(255) NOT NULL,
  Relationship VARCHAR(100) NULL,

  -- ऋण विवरण
  LoanAmount VARCHAR(100) NULL,
  RateOfInterest VARCHAR(50) NULL,
  LoanPurpose VARCHAR(255) NULL,
  LoanPeriodYear VARCHAR(50) NULL,
  LoanPeriodMonth VARCHAR(50) NULL,

  -- कानूनी मिति (ईति सम्वत्)
  LegalYear VARCHAR(50) NULL,
  LegalMonth VARCHAR(50) NULL,
  LegalDay VARCHAR(50) NULL,
  LegalDayOfWeek VARCHAR(50) NULL,

  -- कर्मचारी विवरण
  LoanBhibhagPramukh VARCHAR(255) NULL,
  KaryalayaPramukh VARCHAR(255) NULL,
  StaffID VARCHAR(100) NULL,
  StaffName VARCHAR(255) NULL,
  StaffPost VARCHAR(255) NULL,
  Remarks TEXT NULL,

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
  ('loanpariwarikswikriti.view',    'View loan pariwarik swikriti'),
  ('loanpariwarikswikriti.create',  'Create loan pariwarik swikriti'),
  ('loanpariwarikswikriti.edit',    'Edit loan pariwarik swikriti'),
  ('loanpariwarikswikriti.approve', 'Verify/approve loan pariwarik swikriti'),
  ('loanpariwarikswikriti.delete',  'Delete loan pariwarik swikriti');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanpariwarikswikriti.view', 'loanpariwarikswikriti.create', 'loanpariwarikswikriti.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanpariwarikswikriti.view', 'loanpariwarikswikriti.create', 'loanpariwarikswikriti.edit', 'loanpariwarikswikriti.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanpariwarikswikriti.view', 'loanpariwarikswikriti.create', 'loanpariwarikswikriti.edit', 'loanpariwarikswikriti.approve', 'loanpariwarikswikriti.delete');

