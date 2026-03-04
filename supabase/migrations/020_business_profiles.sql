-- 020_business_profiles.sql
-- Business profiles: waitlist, profile fields, storage, voucher RLS tightening

-- ============================================================
-- 1A. Business waitlist table
-- ============================================================
CREATE TABLE IF NOT EXISTS business_waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text NOT NULL,
  contact_name    text NOT NULL,
  email           text NOT NULL UNIQUE,
  business_type   text NOT NULL,
  message         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit interest
CREATE POLICY "Anyone can submit business interest"
  ON business_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view business waitlist"
  ON business_waitlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 1B. Business fields on profiles
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_business boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_logo_url text,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS business_description text,
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS business_opening_hours jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_is_business
  ON profiles(is_business) WHERE is_business = true;

-- ============================================================
-- 1C. business-logos storage bucket + policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read business logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'business-logos');

-- Users can upload to their own folder
CREATE POLICY "Users upload own business logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own logo
CREATE POLICY "Users update own business logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own logo
CREATE POLICY "Users delete own business logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 1D. Tighten voucher INSERT RLS to require is_business = true
-- ============================================================
DROP POLICY IF EXISTS "Business owner can create vouchers" ON vouchers;

CREATE POLICY "Business owner can create vouchers"
  ON vouchers FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_business = true
    )
  );

-- ============================================================
-- 1E. Business owners can view ALL own vouchers (any status)
-- ============================================================
CREATE POLICY "Business owners can view all own vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

-- ============================================================
-- 1F. Backfill existing voucher creators to is_business = true
-- ============================================================
UPDATE profiles
SET is_business = true
WHERE id IN (
  SELECT DISTINCT business_id FROM vouchers
)
AND is_business = false;
