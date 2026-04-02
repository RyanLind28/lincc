-- Events can optionally be hosted by a business page
ALTER TABLE events ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id) WHERE business_id IS NOT NULL;
