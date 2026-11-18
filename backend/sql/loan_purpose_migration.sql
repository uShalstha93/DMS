-- ============================================================
-- Loan Purpose (ऋण सदुपयोग गर्ने विवरण) Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanpurposeofloans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,

  -- ऋणी विवरण
  BorrowerName VARCHAR(255) NULL,
  BorrowerAddress VARCHAR(255) NULL,

  -- ऋण विवरण
  LoanPurpose VARCHAR(255) NULL,
  LoanAmount VARCHAR(100) NULL,
  LoanAmountWords VARCHAR(255) NULL,
  IncomeSource VARCHAR(255) DEFAULT 'नोकरी',
  LoanPurposeCategory VARCHAR(255) DEFAULT '(झ) घरायसी/सामाजिक कार्य ऋण',

  -- सदुपयोग सम्बन्धी विवरणहरु
  LoanPurposeDetail1 TEXT NULL,
  LoanPurposeDetail2 TEXT NULL,
  OtherDetail TEXT NULL,
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
  ('loanpurpose.view',    'View purpose of loan'),
  ('loanpurpose.create',  'Create purpose of loan'),
  ('loanpurpose.edit',    'Edit purpose of loan'),
  ('loanpurpose.approve', 'Verify/approve purpose of loan'),
  ('loanpurpose.delete',  'Delete purpose of loan');

-- Assign permissions to roles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanpurpose.view', 'loanpurpose.create', 'loanpurpose.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanpurpose.view', 'loanpurpose.create', 'loanpurpose.edit', 'loanpurpose.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanpurpose.view', 'loanpurpose.create', 'loanpurpose.edit', 'loanpurpose.approve', 'loanpurpose.delete');
