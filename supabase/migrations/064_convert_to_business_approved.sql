-- 064_convert_to_business_approved.sql
-- Finish what 061 started: take verification out of the conversion path too.
--
-- 061 made *new* business signups (handle_new_user) start as status='approved'
-- so they can post immediately, with verification (the businesses.verified
-- tick) demoted to an optional, later step. But the convert_to_business() RPC
-- — used when an existing PERSONAL account upgrades to a business via
-- BecomeBusinessPage — was missed and still created the row as
-- 'pending_approval'. That left converted businesses locked out of publishing
-- (events_publish_gate / vouchers_publish_gate RAISE unless status='approved')
-- and staring at the "Get verified" wall.
--
-- This aligns the conversion path with signup: approved on creation. The
-- publish gates stay in place — they still correctly block 'suspended' /
-- 'inactive'. The official "verified" tick is untouched and stays optional.

CREATE OR REPLACE FUNCTION public.convert_to_business(
  p_name text,
  p_category text DEFAULT 'Other'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_business uuid;
  v_slug text;
  v_slug_attempt text;
  v_suffix int := 1;
  v_business_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  -- One business per owner: if they already have one, return it instead of
  -- creating a duplicate. Lets the UI safely retry on flaky connections.
  SELECT id INTO v_existing_business
  FROM businesses WHERE owner_id = v_user_id LIMIT 1;
  IF v_existing_business IS NOT NULL THEN
    UPDATE profiles SET account_type = 'business' WHERE id = v_user_id;
    RETURN v_existing_business;
  END IF;

  -- Slugify with collision suffix
  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');
  IF v_slug = '' THEN v_slug := 'biz-' || substr(v_user_id::text, 1, 8); END IF;
  v_slug_attempt := v_slug;
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = v_slug_attempt) LOOP
    v_suffix := v_suffix + 1;
    v_slug_attempt := v_slug || '-' || v_suffix;
  END LOOP;

  -- Approved on creation so the business can post straight away. Verification
  -- (businesses.verified) is a separate, optional step from the dashboard.
  INSERT INTO businesses (owner_id, name, slug, category, status)
  VALUES (
    v_user_id,
    trim(p_name),
    v_slug_attempt,
    COALESCE(NULLIF(trim(p_category), ''), 'Other'),
    'approved'
  )
  RETURNING id INTO v_business_id;

  UPDATE profiles SET account_type = 'business' WHERE id = v_user_id;

  RETURN v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_to_business(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_to_business(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_to_business(text, text) TO authenticated;

-- Backfill: any business still stuck pending from a pre-fix conversion gets
-- approved so it can publish. rejected/suspended/inactive/archived untouched.
UPDATE businesses SET status = 'approved', updated_at = now()
WHERE status = 'pending_approval';
