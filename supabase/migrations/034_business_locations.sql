-- ============================================
-- Migration 034: Business locations
-- Businesses can have multiple locations
-- ============================================

-- Create business_locations table
CREATE TABLE business_locations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name            text NOT NULL DEFAULT 'Main',
    address         text NOT NULL,
    lat             float8 NOT NULL DEFAULT 0,
    lng             float8 NOT NULL DEFAULT 0,
    is_primary      boolean NOT NULL DEFAULT false,
    status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_locations_business ON business_locations(business_id);

-- Updated_at trigger
CREATE TRIGGER set_business_locations_updated_at
    BEFORE UPDATE ON business_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active locations"
    ON business_locations FOR SELECT TO authenticated
    USING (status = 'active');

CREATE POLICY "Owners can view own locations"
    ON business_locations FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()));

CREATE POLICY "Owners can create locations"
    ON business_locations FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()));

CREATE POLICY "Owners can update own locations"
    ON business_locations FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()));

CREATE POLICY "Owners can delete own locations"
    ON business_locations FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()));

-- Migrate existing business addresses into locations
INSERT INTO business_locations (business_id, name, address, is_primary)
SELECT id, 'Main', address, true
FROM businesses
WHERE address IS NOT NULL AND address != '';

-- Add location_id to vouchers (nullable — existing vouchers keep their venue fields)
ALTER TABLE vouchers ADD COLUMN location_id uuid REFERENCES business_locations(id) ON DELETE SET NULL;

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE business_locations;
