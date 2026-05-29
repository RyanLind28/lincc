-- 068_handle_new_user_names.sql
-- Fix the signup metadata key mismatch that silently dropped names.
--
-- The app's signUp() sends first_name / last_name / profile_name in user
-- metadata, but handle_new_user only ever read contact_name / full_name / name
-- and only inserted first_name. So:
--   * business contact names were lost (first_name saved as ''), and
--   * last_name / profile_name were never persisted at signup for anyone.
--
-- (The empty business first_name is also what tripped the /business/dashboard
-- redirect loop, now separately guarded in checkProfileComplete.)
--
-- This rewrites the resolver to prefer the explicit keys the app sends, keeps
-- full_name / name as OAuth fallbacks (Google sign-in), and persists first_name
-- + last_name. We deliberately do NOT set profile_name here: it has a
-- case-insensitive UNIQUE constraint (it's the public handle), so defaulting it
-- to "First Last" would collide across users and the trigger would throw,
-- breaking signup. profile_name stays NULL (collision-safe; display falls back
-- to first_name) and is chosen later in onboarding. The business-creation block
-- (approved on creation) is unchanged.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first text;
  v_last text;
  v_full_name text;
  v_terms_accepted_at timestamptz;
  v_account_type text;
  v_business_name text;
  v_business_category text;
  v_slug text;
  v_slug_attempt text;
  v_suffix int;
BEGIN
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- First name: explicit key first (email signup), then OAuth/legacy fallbacks.
  v_first := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
  IF v_first IS NULL THEN
    v_first := NULLIF(trim(NEW.raw_user_meta_data->>'contact_name'), '');
  END IF;
  IF v_first IS NULL THEN
    v_first := NULLIF(trim(split_part(v_full_name, ' ', 1)), '');
  END IF;
  IF v_first IS NULL THEN
    v_first := NULLIF(trim(split_part(NEW.raw_user_meta_data->>'name', ' ', 1)), '');
  END IF;

  -- Last name: explicit key, then the remainder of an OAuth full_name.
  v_last := NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), '');
  IF v_last IS NULL AND position(' ' in COALESCE(v_full_name, '')) > 0 THEN
    v_last := NULLIF(trim(substring(v_full_name from position(' ' in v_full_name) + 1)), '');
  END IF;

  -- Parse terms_accepted_at safely
  BEGIN
    v_terms_accepted_at := (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_terms_accepted_at := NULL;
  END;

  -- Resolve account type (new key first, legacy is_business fallback).
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

  INSERT INTO public.profiles (id, email, first_name, last_name, terms_accepted_at, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_first, ''),
    COALESCE(v_last, ''),
    v_terms_accepted_at,
    v_account_type
  )
  ON CONFLICT (id) DO NOTHING;

  -- Business accounts: create an approved business so they can post immediately.
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

-- Backfill: restore the contact name for existing profiles whose first_name was
-- dropped (mostly business accounts), from the auth metadata the app stored.
-- profile_name is intentionally left untouched (unique handle — set in onboarding).
UPDATE public.profiles p
SET
  first_name = COALESCE(NULLIF(trim(u.raw_user_meta_data->>'first_name'), ''), p.first_name),
  last_name = COALESCE(NULLIF(trim(p.last_name), ''), NULLIF(trim(u.raw_user_meta_data->>'last_name'), ''), p.last_name),
  updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND (p.first_name IS NULL OR trim(p.first_name) = '')
  AND NULLIF(trim(u.raw_user_meta_data->>'first_name'), '') IS NOT NULL;
