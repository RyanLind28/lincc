-- 016_vouchers.sql
-- Voucher system: vouchers table, redemptions tracking, RLS, and seed data

-- ============================================================
-- 1. Vouchers table
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  discount_text   text NOT NULL,          -- e.g. "20% OFF", "2-for-1", "FREE"
  original_price  numeric(10,2),
  discounted_price numeric(10,2),
  redemption_code text,                   -- e.g. "PIZZA20"
  redemption_limit int,                   -- total uses allowed (null = unlimited)
  redemption_count int NOT NULL DEFAULT 0,
  terms           text,                   -- T&C text
  cover_image_url text,
  venue_name      text NOT NULL,
  venue_address   text NOT NULL,
  venue_lat       float8 NOT NULL,
  venue_lng       float8 NOT NULL,
  expires_at      timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expired','redeemed','deleted')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_business ON vouchers(business_id);
CREATE INDEX idx_vouchers_expires ON vouchers(expires_at);
CREATE INDEX idx_vouchers_location ON vouchers(venue_lat, venue_lng);

-- ============================================================
-- 2. Voucher redemptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id  uuid REFERENCES vouchers(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voucher_id, user_id)            -- one redemption per user per voucher
);

CREATE INDEX idx_voucher_redemptions_user ON voucher_redemptions(user_id);
CREATE INDEX idx_voucher_redemptions_voucher ON voucher_redemptions(voucher_id);

-- ============================================================
-- 3. RLS Policies
-- ============================================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Vouchers: any authenticated user can read active vouchers
CREATE POLICY "Anyone can view active vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Vouchers: business owner can insert
CREATE POLICY "Business owner can create vouchers"
  ON vouchers FOR INSERT
  TO authenticated
  WITH CHECK (business_id = auth.uid());

-- Vouchers: business owner can update own vouchers
CREATE POLICY "Business owner can update own vouchers"
  ON vouchers FOR UPDATE
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Vouchers: business owner can delete own vouchers
CREATE POLICY "Business owner can delete own vouchers"
  ON vouchers FOR DELETE
  TO authenticated
  USING (business_id = auth.uid());

-- Redemptions: user can view own redemptions
CREATE POLICY "Users can view own redemptions"
  ON voucher_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Redemptions: user can insert own redemptions
CREATE POLICY "Users can redeem vouchers"
  ON voucher_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. Seed data — example vouchers with London venues
-- ============================================================
-- Uses the owner account as business_id for demo purposes
DO $$
DECLARE
  owner_id uuid := '0b39d573-f7da-41d7-8db8-49025ea326f1';
  cat_food uuid;
  cat_coffee uuid;
  cat_fitness uuid;
  cat_entertainment uuid;
BEGIN
  -- Look up category IDs
  SELECT id INTO cat_food FROM categories WHERE name ILIKE '%Food%' LIMIT 1;
  SELECT id INTO cat_coffee FROM categories WHERE name ILIKE '%Coffee%' LIMIT 1;
  SELECT id INTO cat_fitness FROM categories WHERE name ILIKE '%Fitness%' LIMIT 1;
  SELECT id INTO cat_entertainment FROM categories WHERE name ILIKE '%Entertainment%' LIMIT 1;

  INSERT INTO vouchers (business_id, category_id, title, description, discount_text,
    original_price, discounted_price, redemption_code, redemption_limit, terms,
    cover_image_url, venue_name, venue_address, venue_lat, venue_lng, expires_at)
  VALUES
    -- 1. Pizza deal
    (owner_id, cat_food,
     '20% Off Any Pizza',
     'Get 20% off any pizza from our menu. Valid for dine-in and takeaway.',
     '20% OFF',
     15.00, 12.00, 'PIZZA20', 100,
     'Valid on pizzas only. Cannot be combined with other offers. One use per customer.',
     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
     'Franco Manca Soho',
     '98 Tottenham Court Rd, London W1T 4TR',
     51.5210, -0.1340,
     now() + interval '14 days'),

    -- 2. Free coffee
    (owner_id, cat_coffee,
     'Free Flat White',
     'Enjoy a complimentary flat white on us. Perfect for your morning pick-me-up!',
     'FREE',
     4.50, 0.00, 'FLATFREE', 50,
     'One per customer. Valid Mon-Fri before 11am only.',
     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
     'Monmouth Coffee',
     '27 Monmouth St, London WC2H 9EU',
     51.5143, -0.1265,
     now() + interval '7 days'),

    -- 3. 2-for-1 drinks
    (owner_id, cat_food,
     '2-for-1 Cocktails',
     'Buy one cocktail, get one free! Choose from our full cocktail menu.',
     '2-for-1',
     14.00, 7.00, 'COCKTAIL241', 200,
     'Valid Sunday to Thursday, 5pm-8pm. Cheapest cocktail free.',
     'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop',
     'The Alchemist',
     '6 Bevis Marks, London EC3A 7BA',
     51.5142, -0.0789,
     now() + interval '30 days'),

    -- 4. Gym day pass
    (owner_id, cat_fitness,
     '50% Off Day Pass',
     'Half price day pass to our state-of-the-art gym. Includes pool and sauna access.',
     '50% OFF',
     20.00, 10.00, 'GYM50', 75,
     'Valid any day. Must present voucher at reception. Under 18s not permitted.',
     'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
     'PureGym Camden',
     '4-10 Camden High St, London NW1 0JH',
     51.5392, -0.1426,
     now() + interval '21 days'),

    -- 5. Cinema ticket
    (owner_id, cat_entertainment,
     'Half Price Cinema Ticket',
     'Get any standard screening ticket for half price. Grab some popcorn and enjoy!',
     '50% OFF',
     16.00, 8.00, 'CINEMA50', 150,
     'Standard screenings only. Not valid for IMAX, 3D, or special events. Mon-Thu only.',
     'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
     'Curzon Soho',
     '99 Shaftesbury Ave, London W1D 5DY',
     51.5131, -0.1310,
     now() + interval '10 days');
END $$;
