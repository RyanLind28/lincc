-- 021_waitlist_business_flag.sql
-- Add business registration fields to the existing waitlist table

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS is_business boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_type text;
