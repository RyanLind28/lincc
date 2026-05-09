-- 048_last_name_and_profile_name.sql
--
-- Adds last_name and profile_name to profiles, plus onboarding_step for resuming
-- a partial onboarding flow. Updates handle_new_user to read first_name +
-- last_name + profile_name from raw_user_meta_data, with sensible fallbacks
-- for older signups that only sent contact_name (or nothing for personal flow).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_name text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_name text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_step text;

-- Backfill profile_name for existing rows: prefer first_name, else 'User'.
UPDATE profiles
SET profile_name = COALESCE(NULLIF(first_name, ''), 'User')
WHERE profile_name IS NULL OR profile_name = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_profile_name text;
  v_terms_accepted_at timestamptz;
  v_account_type text;
  v_business_name text;
  v_business_category text;
  v_slug text;
  v_slug_attempt text;
  v_suffix int;
BEGIN
  -- First name resolution.
  -- Order: explicit first_name → contact_name → first token of OAuth full_name → first token of OAuth name.
  v_first_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'contact_name'), ''),
    NULLIF(trim(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)), ''),
    NULLIF(trim(split_part(NEW.raw_user_meta_data->>'name', ' ', 1)), ''),
    ''
  );

  -- Last name resolution.
  -- Order: explicit last_name → second-onwards of OAuth full_name → second-onwards of OAuth name.
  v_last_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), ''),
    NULLIF(trim(substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1)), ''),
    NULLIF(trim(substring(NEW.raw_user_meta_data->>'name' from position(' ' in NEW.raw_user_meta_data->>'name') + 1)), ''),
    ''
  );
  -- substring() returns the whole string if there's no space (position returns 0 → +1 = 1).
  -- Guard against that producing the same value as first_name.
  IF v_last_name = v_first_name THEN
    v_last_name := '';
  END IF;

  -- Profile name: explicit override, else first + last (trimmed), else 'User'.
  v_profile_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'profile_name'), ''),
    NULLIF(trim(concat_ws(' ', NULLIF(v_first_name, ''), NULLIF(v_last_name, ''))), ''),
    'User'
  );

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

  INSERT INTO public.profiles (id, email, first_name, last_name, profile_name, terms_accepted_at, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_profile_name,
    v_terms_accepted_at,
    v_account_type
  )
  ON CONFLICT (id) DO NOTHING;

  -- For business accounts, also create a pending business record (unchanged from 047).
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
