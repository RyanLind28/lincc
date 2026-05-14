-- 055_business_schema_alignment.sql
-- Brings declared migrations in line with the live businesses schema and adds a
-- dedicated bucket for voucher cover images. The verified/social_links columns
-- were hot-patched on production; this migration makes them reproducible on
-- staging rebuilds. Idempotent so re-running against production is safe.

-- 1. businesses.verified / verified_at / social_links
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS social_links jsonb;

CREATE INDEX IF NOT EXISTS idx_businesses_verified
  ON businesses(verified) WHERE verified = true;

-- 2. voucher-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voucher-covers', 'voucher-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read so anyone can render voucher cover images
DROP POLICY IF EXISTS "voucher_cover_select" ON storage.objects;
CREATE POLICY "voucher_cover_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'voucher-covers');

-- Insert/update/delete restricted to the user's own folder. The CreateVoucher
-- flow writes to `${user.id}/${timestamp}.jpg`, and the policy on the vouchers
-- table separately enforces that the user owns the parent business.
DROP POLICY IF EXISTS "voucher_cover_insert" ON storage.objects;
CREATE POLICY "voucher_cover_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voucher-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "voucher_cover_update" ON storage.objects;
CREATE POLICY "voucher_cover_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'voucher-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "voucher_cover_delete" ON storage.objects;
CREATE POLICY "voucher_cover_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voucher-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "admin_voucher_cover_delete" ON storage.objects;
CREATE POLICY "admin_voucher_cover_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'voucher-covers' AND is_admin());
