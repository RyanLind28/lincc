-- ============================================
-- Migration 033: Separate businesses table
-- One user can own multiple business pages
-- ============================================

-- Phase A: Create businesses table
CREATE TABLE businesses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name            text NOT NULL,
    slug            text UNIQUE,
    logo_url        text,
    category        text NOT NULL DEFAULT 'Other',
    description     text,
    address         text,
    opening_hours   jsonb,
    status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_status ON businesses(status) WHERE status = 'active';
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER set_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase B: RLS on businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active businesses"
    ON businesses FOR SELECT TO authenticated
    USING (status = 'active');

CREATE POLICY "Owners can view own businesses"
    ON businesses FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create businesses"
    ON businesses FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own businesses"
    ON businesses FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own businesses"
    ON businesses FOR DELETE TO authenticated
    USING (owner_id = auth.uid());

-- Phase C: Migrate existing business data from profiles
INSERT INTO businesses (owner_id, name, logo_url, category, description, address, opening_hours)
SELECT
    id,
    business_name,
    business_logo_url,
    COALESCE(business_category, 'Other'),
    business_description,
    business_address,
    business_opening_hours
FROM profiles
WHERE is_business = true AND business_name IS NOT NULL;

-- Phase D: Update vouchers FK
-- Add new column pointing to businesses table
ALTER TABLE vouchers ADD COLUMN new_business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;

-- Backfill: map old profile-based business_id to new businesses.id
UPDATE vouchers v
SET new_business_id = b.id
FROM businesses b
WHERE b.owner_id = v.business_id;

-- Swap columns (keep old one as safety net)
ALTER TABLE vouchers RENAME COLUMN business_id TO legacy_business_id;
ALTER TABLE vouchers RENAME COLUMN new_business_id TO business_id;

-- Phase E: Update voucher RLS policies
DROP POLICY IF EXISTS "Business owner can create vouchers" ON vouchers;
DROP POLICY IF EXISTS "Business owner can update own vouchers" ON vouchers;
DROP POLICY IF EXISTS "Business owner can delete own vouchers" ON vouchers;
DROP POLICY IF EXISTS "Business owners can view all own vouchers" ON vouchers;

CREATE POLICY "Business owner can create vouchers"
    ON vouchers FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE id = business_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Business owner can update own vouchers"
    ON vouchers FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
    );

CREATE POLICY "Business owner can delete own vouchers"
    ON vouchers FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
    );

CREATE POLICY "Business owners can view all own vouchers"
    ON vouchers FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
    );

-- Phase F: Add businesses to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
