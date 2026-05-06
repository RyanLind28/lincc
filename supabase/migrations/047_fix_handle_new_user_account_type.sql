-- 047_fix_handle_new_user_account_type.sql
-- Restore account_type + pending businesses-row creation in handle_new_user.
--
-- Regression: an earlier May fix that added OAuth-name resolution overwrote
-- the function from 045_account_types_and_approval and dropped the branches
-- that read raw_user_meta_data->>'account_type' and inserted the pending
-- business. Result: every business signup landed as account_type='personal'
-- with no businesses row, so the user looked like a personal account.
--
-- This migration merges both: OAuth-name resolution AND account_type +
-- business creation. It also backfills the one signup that hit the bug.

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

  -- For business accounts, also create a pending business record
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
        VALUES (NEW.id, v_business_name, v_slug_attempt, v_business_category, 'pending_approval');
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

-- Backfill: any user whose auth metadata says business but whose profile
-- ended up personal (because they signed up while the broken trigger was live).
-- Flips account_type and creates the pending businesses row if missing.
DO $$
DECLARE
  r record;
  v_business_name text;
  v_business_category text;
  v_slug text;
  v_slug_attempt text;
  v_suffix int;
BEGIN
  FOR r IN
    SELECT u.id, u.raw_user_meta_data
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE p.account_type = 'personal'
      AND (
        u.raw_user_meta_data->>'account_type' = 'business'
        OR (u.raw_user_meta_data->>'is_business')::boolean IS TRUE
      )
  LOOP
    UPDATE profiles SET account_type = 'business' WHERE id = r.id;

    IF NOT EXISTS (SELECT 1 FROM businesses WHERE owner_id = r.id) THEN
      v_business_name := NULLIF(trim(r.raw_user_meta_data->>'business_name'), '');
      v_business_category := COALESCE(NULLIF(r.raw_user_meta_data->>'business_category', ''), 'Other');

      IF v_business_name IS NOT NULL THEN
        v_slug := lower(regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g'));
        v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');
        IF v_slug = '' THEN v_slug := 'biz-' || substr(r.id::text, 1, 8); END IF;
        v_slug_attempt := v_slug;
        v_suffix := 1;
        WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = v_slug_attempt) LOOP
          v_suffix := v_suffix + 1;
          v_slug_attempt := v_slug || '-' || v_suffix;
        END LOOP;

        INSERT INTO businesses (owner_id, name, slug, category, status)
        VALUES (r.id, v_business_name, v_slug_attempt, v_business_category, 'pending_approval');
      END IF;
    END IF;
  END LOOP;
END $$;
