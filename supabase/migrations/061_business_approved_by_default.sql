-- 061_business_approved_by_default.sql
-- Remove verification friction from business signup.
--
-- Previously a business signed up as status='pending_approval' and could not
-- publish events/vouchers until an admin approved their uploaded verification
-- documents (enforced by the events_publish_gate / vouchers_publish_gate
-- triggers, which RAISE EXCEPTION unless status='approved').
--
-- We've moved verification out of the signup flow and made it an optional,
-- later step that earns the official tick (businesses.verified). So businesses
-- should now be APPROVED by default and able to post straight away. The
-- publish gates stay in place — they still correctly block 'suspended' and
-- 'inactive' businesses — only the default starting status changes.
--
-- The official "verified" tick (businesses.verified) is untouched: it still
-- flips to true only when an admin approves the verification documents.

-- 1. New businesses are approved on creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_resolved_name text;
  v_terms_accepted_at timestamptz;
  v_account_type text;
  v_business_name text;
  v_business_category text;
  v_slug text;
  v_slug_attempt text;
  v_suffix int;
BEGIN
  -- Email signup → contact_name (unified field for personal + business).
  -- OAuth (Google) → full_name / name; we take the first whitespace-separated token.
  v_resolved_name := NULLIF(trim(NEW.raw_user_meta_data->>'contact_name'), '');
  IF v_resolved_name IS NULL THEN
    v_resolved_name := NULLIF(trim(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)), '');
  END IF;
  IF v_resolved_name IS NULL THEN
    v_resolved_name := NULLIF(trim(split_part(NEW.raw_user_meta_data->>'name', ' ', 1)), '');
  END IF;

  -- Parse terms_accepted_at safely
  BEGIN
    v_terms_accepted_at := (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_terms_accepted_at := NULL;
  END;

  -- Resolve account type. Reads new key first, falls back to legacy is_business
  -- so any in-flight signups during deploy don't break.
  v_account_type := NULLIF(NEW.raw_user_meta_data->>'account_type', '');
  IF v_account_type IS NULL THEN
    IF COALESCE((NEW.raw_user_meta_data->>'is_business')::boolean, false) THEN
      v_account_type := 'business';
    ELSE
      v_account_type := 'personal';
    END IF;
  END IF;
  IF v_account_type NOT IN ('personal','business') THEN
    v_account_type := 'personal';
  END IF;

  INSERT INTO public.profiles (id, email, first_name, terms_accepted_at, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_resolved_name, ''),
    v_terms_accepted_at,
    v_account_type
  )
  ON CONFLICT (id) DO NOTHING;

  -- For business accounts, also create an approved business record so they can
  -- post immediately. Verification (the official tick) is a separate, optional
  -- step from the dashboard.
  IF v_account_type = 'business' THEN
    v_business_name := NULLIF(trim(NEW.raw_user_meta_data->>'business_name'), '');
    v_business_category := COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_category', ''), 'Other');

    IF v_business_name IS NOT NULL THEN
      v_slug := lower(regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g'));
      v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');
      IF v_slug = '' THEN v_slug := 'biz-' || substr(NEW.id::text, 1, 8); END IF;
      v_slug_attempt := v_slug;
      v_suffix := 1;
      WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = v_slug_attempt) LOOP
        v_suffix := v_suffix + 1;
        v_slug_attempt := v_slug || '-' || v_suffix;
      END LOOP;

      BEGIN
        INSERT INTO businesses (owner_id, name, slug, category, status)
        VALUES (NEW.id, v_business_name, v_slug_attempt, v_business_category, 'approved');
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: failed to create business for %: %', NEW.id, SQLERRM;
      END;
    ELSE
      RAISE LOG 'handle_new_user: business signup % missing business_name metadata', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Backfill: existing businesses still stuck pending now get approved so they
--    can publish. We leave rejected/suspended/inactive/archived untouched.
UPDATE businesses SET status = 'approved', updated_at = now()
WHERE status = 'pending_approval';
