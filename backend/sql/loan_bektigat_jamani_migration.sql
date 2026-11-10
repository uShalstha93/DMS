-- ============================================================
-- Loan Bektigat Jamani (व्यक्तिगत जमानी तमसुक) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanbektigatjamanis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,

  -- ऋणीको विवरण (Borrower)
  BorrowerName VARCHAR(255) NULL,
  BorrowerGrandfatherName VARCHAR(255) NULL,
  BorrowerFatherName VARCHAR(255) NULL,
  BorrowerSpouseName VARCHAR(255) NULL,
  BorrowerProvince VARCHAR(100) NULL,
  BorrowerDistrict VARCHAR(100) NULL,
  BorrowerPalika VARCHAR(150) NULL,
  BorrowerWard VARCHAR(50) NULL,
  BorrowerAge VARCHAR(50) NULL,
  BorrowerCitizenshipNo VARCHAR(100) NULL,
  BorrowerCitizenshipDistrict VARCHAR(100) NULL,
  BorrowerCitizenshipPalika VARCHAR(150) NULL,
  BorrowerCitizenshipWard VARCHAR(50) NULL,
  BorrowerCitizenshipDate VARCHAR(100) NULL,

  -- ऋण विवरण (Loan)
  LoanPurpose VARCHAR(255) NULL,
  LoanAmount VARCHAR(100) NULL,
  LoanAmountWords VARCHAR(255) NULL,
  LoanDate VARCHAR(100) NULL,

  -- जमानी दिने व्यक्तिको विवरण (Guarantor)
  JamaniName VARCHAR(255) NOT NULL,
  JamaniGrandfatherName VARCHAR(255) NULL,
  JamaniFatherName VARCHAR(255) NULL,
  JamaniSpouseName VARCHAR(255) NULL,
  JamaniProvince VARCHAR(100) NULL,
  JamaniDistrict VARCHAR(100) NULL,
  JamaniPalika VARCHAR(150) NULL,
  JamaniWard VARCHAR(50) NULL,
  JamaniAge VARCHAR(50) NULL,
  JamaniMemberNo VARCHAR(100) NULL,
  JamaniCitizenshipNo VARCHAR(100) NULL,

  -- साक्षी विवरण (Witnesses)
  SakshiName1 VARCHAR(255) NULL,
  SakshiDistrict1 VARCHAR(100) NULL,
  SakshiPalika1 VARCHAR(150) NULL,
  SakshiWardNo1 VARCHAR(50) NULL,
  SakshiAge1 VARCHAR(50) NULL,
  SakshiRelation1 VARCHAR(255) NULL,

  SakshiName2 VARCHAR(255) NULL,
  SakshiDistrict2 VARCHAR(100) NULL,
  SakshiPalika2 VARCHAR(150) NULL,
  SakshiWardNo2 VARCHAR(50) NULL,
  SakshiAge2 VARCHAR(50) NULL,
  SakshiRelation2 VARCHAR(255) NULL,

  -- कानूनी मिति (ईति सम्वत्)
  LegalYear VARCHAR(50) NULL,
  LegalMonth VARCHAR(50) NULL,
  LegalDay VARCHAR(50) NULL,
  LegalDayOfWeek VARCHAR(50) NULL,

  -- कर्मचारी / कार्यालय प्रमुख विवरण
  LoanBhibhagPramukh VARCHAR(255) NULL,
  Bhyabasthapak VARCHAR(255) NULL,
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
  ('loanbektigatjamani.view',    'View loan bektigat jamani'),
  ('loanbektigatjamani.create',  'Create loan bektigat jamani'),
  ('loanbektigatjamani.edit',    'Edit loan bektigat jamani'),
  ('loanbektigatjamani.approve', 'Verify/approve loan bektigat jamani'),
  ('loanbektigatjamani.delete',  'Delete loan bektigat jamani');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanbektigatjamani.view', 'loanbektigatjamani.create', 'loanbektigatjamani.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanbektigatjamani.view', 'loanbektigatjamani.create', 'loanbektigatjamani.edit', 'loanbektigatjamani.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanbektigatjamani.view', 'loanbektigatjamani.create', 'loanbektigatjamani.edit', 'loanbektigatjamani.approve', 'loanbektigatjamani.delete');
