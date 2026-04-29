-- 045_account_types_and_approval.sql
-- Personal vs Business as a first-class account type, with admin approval gate.
-- See plan in /Users/ryanlind/.claude/plans/lovely-watching-dewdrop.md

-- ============= 1. profiles.account_type =============

ALTER TABLE profiles
  ADD COLUMN account_type text NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal','business'));

UPDATE profiles
SET account_type = 'business'
WHERE id IN (SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL);

-- Drop deprecated business columns from profiles (data lives in `businesses`)
DROP INDEX IF EXISTS idx_profiles_is_business;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS is_business,
  DROP COLUMN IF EXISTS business_name,
  DROP COLUMN IF EXISTS business_logo_url,
  DROP COLUMN IF EXISTS business_category,
  DROP COLUMN IF EXISTS business_description,
  DROP COLUMN IF EXISTS business_address,
  DROP COLUMN IF EXISTS business_opening_hours;

-- ============= 2. businesses status + metadata =============

ALTER TABLE businesses ALTER COLUMN owner_id DROP NOT NULL;

-- Drop old constraint first; we'll re-add the broader check after data migration
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_status_check;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ============= 3. Dedup: one business per owner =============

WITH ranked AS (
  SELECT id, owner_id,
         ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) AS rn
  FROM businesses
  WHERE owner_id IS NOT NULL
)
UPDATE businesses b
SET owner_id = NULL, status = 'archived'
FROM ranked
WHERE b.id = ranked.id AND ranked.rn > 1;

-- ============= 4. Status migration with auto-approval =============

UPDATE businesses b
SET status = 'approved'
WHERE status = 'active'
  AND (
    EXISTS (SELECT 1 FROM events   e WHERE e.business_id = b.id AND e.status = 'active')
    OR EXISTS (SELECT 1 FROM vouchers v WHERE v.business_id = b.id AND v.status = 'active')
  );

UPDATE businesses SET status = 'pending_approval' WHERE status = 'active';

-- Now add the new constraint (data is consistent)
ALTER TABLE businesses
  ADD CONSTRAINT businesses_status_check
  CHECK (status IN ('pending_approval','approved','rejected','suspended','inactive','archived'));

CREATE UNIQUE INDEX businesses_owner_unique
  ON businesses(owner_id) WHERE owner_id IS NOT NULL;

DROP INDEX IF EXISTS idx_businesses_status;
CREATE INDEX idx_businesses_status ON businesses(status) WHERE status = 'approved';

DROP POLICY IF EXISTS "Anyone can view active businesses" ON businesses;
CREATE POLICY "Anyone can view approved businesses"
  ON businesses FOR SELECT TO authenticated
  USING (status = 'approved');

-- ============= 5. Schema for future features =============

ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule text;

-- ============= 6. Cleanup =============

ALTER TABLE vouchers DROP COLUMN IF EXISTS legacy_business_id;

ALTER TABLE waitlist
  DROP COLUMN IF EXISTS is_business,
  DROP COLUMN IF EXISTS business_name,
  DROP COLUMN IF EXISTS business_type;

-- ============= 7. handle_new_user trigger: create pending business =============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_terms_accepted_at timestamptz;
  v_account_type text;
  v_business_name text;
  v_business_category text;
  v_slug text;
  v_slug_attempt text;
  v_suffix int;
BEGIN
  -- Parse terms_accepted_at safely
  BEGIN
    v_terms_accepted_at := (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_terms_accepted_at := NULL;
  END;

  -- Resolve account type. Reads new key first, falls back to legacy is_business
  -- so in-flight signups during deploy don't break.
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

  INSERT INTO public.profiles (id, email, terms_accepted_at, account_type)
  VALUES (NEW.id, NEW.email, v_terms_accepted_at, v_account_type)
  ON CONFLICT (id) DO NOTHING;

  -- For business accounts, also create a pending business record
  IF v_account_type = 'business' THEN
    v_business_name := NULLIF(trim(NEW.raw_user_meta_data->>'business_name'), '');
    v_business_category := COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_category', ''), 'Other');

    IF v_business_name IS NOT NULL THEN
      -- Slugify and resolve uniqueness
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

-- ============= 8. Publish gates (BEFORE INSERT/UPDATE) =============

CREATE OR REPLACE FUNCTION public.events_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_account_type text;
  v_owner_business_id uuid;
  v_target_business_status text;
BEGIN
  -- Skip when there's no auth context (cron, service role, internal triggers)
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  -- Only enforce on INSERT or when status flips to 'active'
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('active','full') THEN
    RETURN NEW;
  END IF;

  SELECT account_type INTO v_actor_account_type
  FROM profiles WHERE id = NEW.host_id;

  IF v_actor_account_type = 'personal' THEN
    IF NEW.business_id IS NOT NULL THEN
      RAISE EXCEPTION 'Personal accounts cannot post events as a business';
    END IF;
  ELSIF v_actor_account_type = 'business' THEN
    SELECT id INTO v_owner_business_id
    FROM businesses WHERE owner_id = NEW.host_id LIMIT 1;

    IF v_owner_business_id IS NULL THEN
      RAISE EXCEPTION 'Business account has no linked business; contact support';
    END IF;
    IF NEW.business_id IS NULL OR NEW.business_id <> v_owner_business_id THEN
      RAISE EXCEPTION 'Business accounts must publish events under their business profile';
    END IF;

    SELECT status INTO v_target_business_status
    FROM businesses WHERE id = NEW.business_id;
    IF v_target_business_status <> 'approved' THEN
      RAISE EXCEPTION 'Your business is awaiting approval before you can publish events';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_publish_gate_trg ON events;
CREATE TRIGGER events_publish_gate_trg
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION public.events_publish_gate();

CREATE OR REPLACE FUNCTION public.vouchers_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_account_type text;
  v_business_status text;
  v_business_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT account_type INTO v_actor_account_type
  FROM profiles WHERE id = auth.uid();

  IF v_actor_account_type IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Only business accounts can publish vouchers';
  END IF;

  SELECT owner_id, status INTO v_business_owner, v_business_status
  FROM businesses WHERE id = NEW.business_id;

  IF v_business_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only publish vouchers under your own business';
  END IF;

  IF v_business_status <> 'approved' THEN
    RAISE EXCEPTION 'Your business is awaiting approval before you can publish vouchers';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vouchers_publish_gate_trg ON vouchers;
CREATE TRIGGER vouchers_publish_gate_trg
BEFORE INSERT OR UPDATE ON vouchers
FOR EACH ROW EXECUTE FUNCTION public.vouchers_publish_gate();

-- ============= 9. Tighten businesses INSERT (only via trigger from now on) =============

DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
-- No INSERT policy means user-side INSERT is blocked; the SECURITY DEFINER trigger
-- bypasses RLS so it can still create the row at signup time.
