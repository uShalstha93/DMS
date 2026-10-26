-- ============================================================
-- Organization Details Table Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyname VARCHAR(255) NOT NULL,
  province VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  munvdc VARCHAR(150) NULL,
  wardno VARCHAR(50) NULL,
  tole VARCHAR(150) NULL,
  contactno VARCHAR(100) NULL,
  panno VARCHAR(50) NULL,
  registrationdate VARCHAR(50) NULL,
  logo VARCHAR(255) NULL,
  email VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional default seed if table is completely empty
INSERT INTO organization_details (
  id, companyname, province, district, munvdc, wardno, tole, contactno, panno, registrationdate, logo, email
) SELECT 
  1,
  'हाम्रो सहकारी संस्था लि.',
  'बागमती',
  'काठमाडौँ',
  'काठमाडौँ महानगरपालिका',
  '10',
  'बानेश्वर',
  '01-4412345',
  '600123456',
  '2075-01-15',
  null,
  'info@dmsfinance.org.np'
WHERE NOT EXISTS (SELECT 1 FROM organization_details WHERE id = 1);
