-- 058_convert_to_business_rpc.sql
-- RPC that lets an existing personal account convert itself into a business.
-- Mirrors what handle_new_user() does at signup time: flips account_type and
-- creates a businesses row in 'pending_approval' status. SECURITY DEFINER so
-- it can bypass the (deliberately absent) INSERT policy on businesses.

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

  INSERT INTO businesses (owner_id, name, slug, category, status)
  VALUES (
    v_user_id,
    trim(p_name),
    v_slug_attempt,
    COALESCE(NULLIF(trim(p_category), ''), 'Other'),
    'pending_approval'
  )
  RETURNING id INTO v_business_id;

  UPDATE profiles SET account_type = 'business' WHERE id = v_user_id;

  RETURN v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_to_business(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_to_business(text, text) TO authenticated;
