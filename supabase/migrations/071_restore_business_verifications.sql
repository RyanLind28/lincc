-- 071_restore_business_verifications.sql
--
-- Restores the business verification schema to the migrations folder.
-- The original migration file was removed from the repo, but the objects
-- still exist (with real customer data) in the live database. This file
-- recreates them exactly as they exist live, written idempotently so it
-- is a safe no-op when run against the live project.
--
-- Objects covered:
--   1. public.business_verifications table (+ RLS, indexes, trigger)
--   2. business-verification-docs storage bucket (+ policies)
--   3. public.get_cron_health() admin health-check function

-- ============================================================
-- 1. business_verifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  operator_selfie_path text,
  id_document_path text,
  selfie_with_id_path text,
  registration_doc_path text,
  additional_doc_paths text[],
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_verifications_status
  ON public.business_verifications (status);
CREATE INDEX IF NOT EXISTS idx_business_verifications_business
  ON public.business_verifications (business_id);

ALTER TABLE public.business_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view own verification" ON public.business_verifications;
CREATE POLICY "Owner can view own verification"
  ON public.business_verifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_verifications.business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can create own verification" ON public.business_verifications;
CREATE POLICY "Owner can create own verification"
  ON public.business_verifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_verifications.business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can update own verification" ON public.business_verifications;
CREATE POLICY "Owner can update own verification"
  ON public.business_verifications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_verifications.business_id AND b.owner_id = auth.uid()
    )
    AND status <> 'approved'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_verifications.business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage verifications" ON public.business_verifications;
CREATE POLICY "Admins manage verifications"
  ON public.business_verifications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_business_verifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_business_verifications_updated_at_trg ON public.business_verifications;
CREATE TRIGGER set_business_verifications_updated_at_trg
  BEFORE UPDATE ON public.business_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_business_verifications_updated_at();

-- ============================================================
-- 2. business-verification-docs storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-verification-docs', 'business-verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Files are stored under <user_id>/<filename>; owners access only their
-- own folder, admins can read everything.

DROP POLICY IF EXISTS "Owner uploads own verification docs" ON storage.objects;
CREATE POLICY "Owner uploads own verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner reads own verification docs" ON storage.objects;
CREATE POLICY "Owner reads own verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner updates own verification docs" ON storage.objects;
CREATE POLICY "Owner updates own verification docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner deletes own verification docs" ON storage.objects;
CREATE POLICY "Owner deletes own verification docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins read all verification docs" ON storage.objects;
CREATE POLICY "Admins read all verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-verification-docs'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- ============================================================
-- 3. get_cron_health() — admin cron job health check
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_cron_health()
RETURNS TABLE(
  jobname text,
  schedule text,
  active boolean,
  last_run_at timestamptz,
  last_status text,
  last_return_message text,
  seconds_since_last_run double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'cron'
AS $$
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    latest.start_time AS last_run_at,
    latest.status::text AS last_status,
    latest.return_message::text AS last_return_message,
    EXTRACT(EPOCH FROM (now() - latest.start_time))::double precision AS seconds_since_last_run
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status, return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC
    LIMIT 1
  ) latest ON true
  WHERE public.is_admin();
$$;

-- Result is empty unless is_admin() passes, so authenticated EXECUTE is safe.
REVOKE EXECUTE ON FUNCTION public.get_cron_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cron_health() TO authenticated, service_role;
