-- ============================================================
-- Loan Request Table & Permissions Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS loanrequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  MemberNo VARCHAR(255) NOT NULL,
  LoanNo VARCHAR(255) NOT NULL,
  EntryDate VARCHAR(100) NULL,
  IncomeSource VARCHAR(255) NULL,
  TotalShareAmount VARCHAR(100) NULL,
  TotalMonthlySaving VARCHAR(100) NULL,
  MonthlySavingRate VARCHAR(100) NULL,
  DepositUptoDate VARCHAR(100) NULL,
  RegularSaving VARCHAR(100) NULL,
  HasDailySaving TINYINT(1) DEFAULT 0,
  HasChildSaving TINYINT(1) DEFAULT 0,
  HasFixedSaving TINYINT(1) DEFAULT 0,
  HasOtherSaving TINYINT(1) DEFAULT 0,
  HasRemainingLoan TINYINT(1) DEFAULT 0,
  RemainingInterest VARCHAR(100) NULL,
  HasOptSavingTrans TINYINT(1) DEFAULT 0,
  HasGivenDhitoOrJamani TINYINT(1) DEFAULT 0,
  ConditionOfOldLoan VARCHAR(100) NULL,
  OtherCondition VARCHAR(255) NULL,
  Sifarish8LoanAmount VARCHAR(100) NULL,
  Sifarish8LoanDate VARCHAR(100) NULL,
  Sifarish9LoanAmount VARCHAR(100) NULL,
  Sifarish9LoanDate VARCHAR(100) NULL,
  UpasamitiMeetingDate VARCHAR(100) NULL,
  UpasamitiMeetingNo VARCHAR(100) NULL,
  UpasamitiApprovedLoanAmount VARCHAR(100) NULL,
  UpasamitiApprovedLoanDate VARCHAR(100) NULL,
  SanchalakMeetingDate VARCHAR(100) NULL,
  SanchalakMeetingNo VARCHAR(100) NULL,
  SanchalakApprovedLoanAmount VARCHAR(100) NULL,
  SanchalakApprovedLoanDate VARCHAR(100) NULL,
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
  ('loanrequest.view',    'View loan requests'),
  ('loanrequest.create',  'Create loan request forms'),
  ('loanrequest.edit',    'Edit loan requests'),
  ('loanrequest.approve', 'Verify/approve loan requests'),
  ('loanrequest.delete',  'Delete loan requests');

-- Assign permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Operator'
   AND p.code IN ('loanrequest.view', 'loanrequest.create', 'loanrequest.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Admin'
   AND p.code IN ('loanrequest.view', 'loanrequest.create', 'loanrequest.edit', 'loanrequest.approve');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON 1=1
 WHERE r.name = 'Administrator'
   AND p.code IN ('loanrequest.view', 'loanrequest.create', 'loanrequest.edit', 'loanrequest.approve', 'loanrequest.delete');

