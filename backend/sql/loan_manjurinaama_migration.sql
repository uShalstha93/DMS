-- ============================================================
-- Loan Manjurinaama (मञ्जुरीनामा) Table & Permissions Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanmanjurinaamas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  
  -- मञ्जुरीनामा दिने (जग्गा धनी) विवरण
  LandDhitoPersonName VARCHAR(255) NULL,
  LandDhitoPersonProvince VARCHAR(100) NULL,
  LandDhitoPersonDistrict VARCHAR(100) NULL,
  LandDhitoPersonMUNVDC VARCHAR(255) NULL,
  LandDhitoPersonWardNo VARCHAR(50) NULL,
  LandDhitoPersonGrandfather VARCHAR(255) NULL,
  LandDhitoPersonFather VARCHAR(255) NULL,
  LandDhitoPersonSpouse VARCHAR(255) NULL,
  LandDhitoPersonAge VARCHAR(50) NULL,

  -- ऋण अवधि तथा विवरण
  LoanPeriodYear VARCHAR(50) NULL,
  LoanPeriodMonth VARCHAR(50) NULL,
  LoanPurpose VARCHAR(255) NULL,
  RateOfInterest VARCHAR(50) NULL,
  LoanAmount VARCHAR(100) NULL,

  -- तपसिल (जग्गा विवरण)
  LandDhitoAddress VARCHAR(255) NULL,
  LandDhitoWardBlockNo VARCHAR(100) NULL,
  LandDhitoKittaNo VARCHAR(100) NULL,
  LandDhitoArea VARCHAR(100) NULL,

  -- साक्षी १ विवरण
  SachiName1 VARCHAR(255) NULL,
  SachiDistrict1 VARCHAR(100) NULL,
  SachiMUNVDC1 VARCHAR(255) NULL,
  SachiWardNo1 VARCHAR(50) NULL,
  SachiAge1 VARCHAR(50) NULL,

  -- साक्षी २ विवरण
  SachiName2 VARCHAR(255) NULL,
  SachiDistrict2 VARCHAR(100) NULL,
  SachiMUNVDC2 VARCHAR(255) NULL,
  SachiWardNo2 VARCHAR(50) NULL,
  SachiAge2 VARCHAR(50) NULL,

  -- ईति सम्वत् मिति
  LegalYear VARCHAR(50) NULL,
  LegalMonth VARCHAR(50) NULL,
  LegalDay VARCHAR(50) NULL,
  LegalDayOfWeek VARCHAR(50) NULL,

  -- कर्मचारी विवरण
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
  ('loanmanjurinaama.view',    'View loan manjurinaama'),
  ('loanmanjurinaama.create',  'Create loan manjurinaama'),
  ('loanmanjurinaama.edit',    'Edit loan manjurinaama'),
  ('loanmanjurinaama.approve', 'Verify/approve loan manjurinaama'),
  ('loanmanjurinaama.delete',  'Delete loan manjurinaama');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanmanjurinaama.view', 'loanmanjurinaama.create', 'loanmanjurinaama.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanmanjurinaama.view', 'loanmanjurinaama.create', 'loanmanjurinaama.edit', 'loanmanjurinaama.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanmanjurinaama.view', 'loanmanjurinaama.create', 'loanmanjurinaama.edit', 'loanmanjurinaama.approve', 'loanmanjurinaama.delete');

