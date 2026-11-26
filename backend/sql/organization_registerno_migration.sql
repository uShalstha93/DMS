-- Add registerno (Darta No) column to existing organization_details table
ALTER TABLE organization_details
  ADD COLUMN registerno VARCHAR(100) NULL AFTER panno;
