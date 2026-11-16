-- ============================================================
-- Loan Dhito Tamasuk (धितो तमसुक) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loandhitotamasuks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,

  -- सहकारी ऐन तथा ठेगाना
  SahakariAin VARCHAR(100) DEFAULT '२०४८',
  JillaSahakariAddress VARCHAR(150) NULL,

  -- ऋणीको विवरण (Borrower)
  BorrowerName VARCHAR(255) NULL,
  BorrowerGrandfatherName VARCHAR(255) NULL,
  BorrowerFatherName VARCHAR(255) NULL,
  BorrowerProvince VARCHAR(100) NULL,
  BorrowerDistrict VARCHAR(100) NULL,
  BorrowerPalika VARCHAR(150) NULL,
  BorrowerWard VARCHAR(50) NULL,
  BorrowerTmpProvince VARCHAR(100) NULL,
  BorrowerTmpDistrict VARCHAR(100) NULL,
  BorrowerTmpPalika VARCHAR(150) NULL,
  BorrowerTmpWard VARCHAR(50) NULL,
  BorrowerCitizenshipNo VARCHAR(100) NULL,
  BorrowerCitizenshipDate VARCHAR(100) NULL,
  BorrowerCitizenshipDistrict VARCHAR(100) NULL,
  BorrowerAge VARCHAR(50) NULL,

  -- ऋण विवरण (Loan)
  LoanPurpose VARCHAR(255) NULL,
  LoanApplicationDate VARCHAR(100) NULL,
  LoanAmount VARCHAR(100) NULL,
  LoanAmountWords VARCHAR(255) NULL,
  RateOfInterest VARCHAR(50) NULL,
  LoanPeriodYear VARCHAR(50) NULL,
  LoanPeriodMonth VARCHAR(50) NULL,
  LoanKista VARCHAR(50) NULL,

  -- तपसिल जग्गा धितोको विवरण (Dhito details)
  DhitoPerson VARCHAR(255) NULL,
  DhitoDistrict VARCHAR(100) NULL,
  DhitoVDCMUN VARCHAR(150) NULL,
  DhitoWardNo VARCHAR(50) NULL,
  DhitoKittaNo VARCHAR(100) NULL,
  DhitoArea VARCHAR(100) NULL,
  DhitoRemarks TEXT NULL,
  DhitoItems JSON NULL,

  -- साक्षी विवरण (Witnesses)
  SakshiName1 VARCHAR(255) NULL,
  SakshiDistrict1 VARCHAR(100) NULL,
  SakshiPalika1 VARCHAR(150) NULL,
  SakshiWardNo1 VARCHAR(50) NULL,
  SakshiMemberNo1 VARCHAR(100) NULL,

  SakshiName2 VARCHAR(255) NULL,
  SakshiDistrict2 VARCHAR(100) NULL,
  SakshiPalika2 VARCHAR(150) NULL,
  SakshiWardNo2 VARCHAR(50) NULL,
  SakshiMemberNo2 VARCHAR(100) NULL,

  -- कानूनी मिति (ईति सम्वत्)
  LegalYear VARCHAR(50) NULL,
  LegalMonth VARCHAR(50) NULL,
  LegalDay VARCHAR(50) NULL,
  LegalDayOfWeek VARCHAR(50) NULL,

  -- कर्मचारी विवरण
  LoanBhibhagPramukh VARCHAR(255) NULL,
  Byabasthapak VARCHAR(255) NULL,
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
  ('loandhitotamasuk.view',    'View loan dhito tamasuk'),
  ('loandhitotamasuk.create',  'Create loan dhito tamasuk'),
  ('loandhitotamasuk.edit',    'Edit loan dhito tamasuk'),
  ('loandhitotamasuk.approve', 'Verify/approve loan dhito tamasuk'),
  ('loandhitotamasuk.delete',  'Delete loan dhito tamasuk');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loandhitotamasuk.view', 'loandhitotamasuk.create', 'loandhitotamasuk.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loandhitotamasuk.view', 'loandhitotamasuk.create', 'loandhitotamasuk.edit', 'loandhitotamasuk.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loandhitotamasuk.view', 'loandhitotamasuk.create', 'loandhitotamasuk.edit', 'loandhitotamasuk.approve', 'loandhitotamasuk.delete');
