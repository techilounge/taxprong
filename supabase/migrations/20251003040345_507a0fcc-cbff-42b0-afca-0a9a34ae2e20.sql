-- Create enum for e-invoice filing status
CREATE TYPE efs_status AS ENUM ('draft', 'queued', 'accepted', 'rejected');

-- Update invoices table to use enum and add rejection reasons
ALTER TABLE invoices 
  ALTER COLUMN efs_status TYPE efs_status USING efs_status::efs_status,
  ADD COLUMN IF NOT EXISTS efs_rejection_reason text,
  ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false;

-- Add index for faster querying by status
CREATE INDEX IF NOT EXISTS idx_invoices_efs_status ON invoices(efs_status);

-- Update existing null values to draft
UPDATE invoices SET efs_status = 'draft' WHERE efs_status IS NULL;