-- Security Fix Step 1: Extend audit_action enum
-- New enum values must be committed before use

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'read';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'access';