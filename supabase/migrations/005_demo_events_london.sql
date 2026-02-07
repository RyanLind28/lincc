-- Demo Events for London
-- Removes capacity cap and inserts realistic London-based demo events
-- Run AFTER 001, 002, 003, 004

-- ===========================================
-- REMOVE CAPACITY CAP
-- ===========================================

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_capacity_check;
ALTER TABLE events ADD CONSTRAINT events_capacity_check
  CHECK (capacity >= 1);

-- ===========================================
-- CLEAN UP OLD DEMO EVENTS
-- ===========================================

-- Delete old San Francisco demo events (from migration 004)
DELETE FROM events WHERE venue_address LIKE '%San Francisco%';

-- ===========================================
-- INSERT LONDON DEMO EVENTS
-- ===========================================

DO $$
DECLARE
  v_host_id UUID;
  v_cat_id UUID;
BEGIN
  -- Get host user ID
  SELECT id INTO v_host_id FROM profiles WHERE email = 'ryanlindie@gmail.com';

  IF v_host_id IS NULL THEN
    RAISE NOTICE 'User ryanlindie@gmail.com not found. Trying first available profile...';
    SELECT id INTO v_host_id FROM profiles LIMIT 1;
  END IF;

  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Please sign up at least one user first.';
  END IF;

  -- =====================
  -- COFFEE
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'coffee';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Morning Coffee Chat', 'Looking for someone to chat with over a flat white. All welcome!', 'Blue Bottle Coffee', 'Shoreditch High St, London E1', 51.5246, -0.0780, NOW() + INTERVAL '30 minutes', 2, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Co-working Session — Free Coffee', 'Productive afternoon working from a great cafe. Bring your laptop!', 'Second Home', 'Hanbury St, Spitalfields, London E1', 51.5194, -0.0756, NOW() + INTERVAL '1 hour', 8, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- FOOD & DRINKS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'food';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Brunch at the New Place', 'Trying the new brunch spot everyone is talking about!', 'The Breakfast Club', 'Camden Passage, London N1', 51.5130, -0.1340, NOW() + INTERVAL '20 hours', 4, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, '50% Off Cocktails — Grand Opening', 'Grand opening week special. Half price cocktails all night!', 'The Alchemist', 'Beech St, Covent Garden, London WC2', 51.5117, -0.1240, NOW() + INTERVAL '4 hours 30 minutes', 30, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, '2-for-1 Burgers This Weekend', 'Weekend deal at Honest Burger. Bring a mate!', 'Honest Burger', 'Brixton Village, London SW9', 51.4613, -0.1156, NOW() + INTERVAL '28 hours', 40, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'New Ramen Spot — 20% Off Launch Week', 'London''s best tonkotsu ramen. Launch week discount!', 'Kanada-Ya', 'St Paul''s, London EC4', 51.5152, -0.0990, NOW() + INTERVAL '3 hours 30 minutes', 20, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- WELLNESS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'wellness';
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE name = 'Yoga & Wellness';
  END IF;
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Morning Yoga in the Park', 'Start the day right. Bring a mat and good vibes.', 'Victoria Park', 'Victoria Park, Hackney, London E9', 51.5362, -0.0356, NOW() + INTERVAL '2 hours', 6, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Women-only Pilates Session', 'Beginner-friendly Pilates in a safe space.', 'Frame Shoreditch', 'Shoreditch High St, London E1', 51.5242, -0.0800, NOW() + INTERVAL '4 hours', 8, 'request', 'women', 'active'),
      (v_host_id, v_cat_id, 'Meditation & Breathwork', 'Wind down with guided breathwork. All levels welcome.', 'Re:Mind Studio', 'Victoria, London SW1', 51.4966, -0.1448, NOW() + INTERVAL '15 hours', 12, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Free Yoga Class — Studio Launch', 'Lululemon is hosting a free launch event! Mats provided.', 'Lululemon Regent St', 'Regent St, London W1', 51.5125, -0.1395, NOW() + INTERVAL '18 hours', 25, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- OUTDOORS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'outdoors';
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE name = 'Hiking';
  END IF;
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Sunset Hike to the Viewpoint', 'Catch the sunset from Parliament Hill. Moderate pace.', 'Hampstead Heath', 'Hampstead, London NW3', 51.5637, -0.1600, NOW() + INTERVAL '6 hours', 8, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Picnic in Greenwich Park', 'Bring food and drinks. We''ll be near the viewpoint!', 'Greenwich Park', 'Greenwich, London SE10', 51.4769, -0.0005, NOW() + INTERVAL '20 hours', 8, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- GAMING
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'gaming';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Board Games & Beers', 'Settlers of Catan, Carcassonne, and craft beers.', 'The Game Parlour', 'Upper St, Islington, London N1', 51.5362, -0.1033, NOW() + INTERVAL '5 hours', 5, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- SPORTS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'sports';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Tennis Doubles Match', 'Need one more for doubles! Intermediate level.', 'Regent''s Park Courts', 'Regent''s Park, London NW1', 51.5313, -0.1570, NOW() + INTERVAL '3 hours', 3, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Saturday Football — Need 2 More', 'Casual 5-a-side. All skill levels.', 'Hackney Marshes', 'Hackney Marshes, London E9', 51.5530, -0.0250, NOW() + INTERVAL '26 hours', 10, 'auto', 'men', 'active'),
      (v_host_id, v_cat_id, 'Padel Match — Intermediate', 'Looking for a 4th player. Intermediate level.', 'Stratford Padel Club', 'Stratford, London E15', 51.5430, -0.0098, NOW() + INTERVAL '22 hours', 3, 'request', 'everyone', 'active');
  END IF;

  -- =====================
  -- FITNESS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'fitness';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Evening Run Club', '5k around Hyde Park. Casual pace, everyone welcome.', 'Hyde Park Corner', 'Hyde Park Corner, London W1', 51.5032, -0.1506, NOW() + INTERVAL '7 hours', 10, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Gym Session — Chest & Tris', 'Looking for a gym buddy. PureGym Aldgate.', 'PureGym Aldgate', 'Aldgate, London EC3', 51.5136, -0.0725, NOW() + INTERVAL '1 hour 30 minutes', 2, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Climbing Session — All Levels', 'Bouldering at The Castle. Beginners very welcome!', 'The Castle Climbing Centre', 'Green Lanes, London N4', 51.5650, -0.0985, NOW() + INTERVAL '5 hours 30 minutes', 4, 'request', 'everyone', 'active');
  END IF;

  -- =====================
  -- CREATIVE
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'creative';
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE name = 'Art & Culture';
  END IF;
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Photography Walk', 'Street photography along the South Bank. Bring any camera.', 'South Bank', 'South Bank, London SE1', 51.5055, -0.1142, NOW() + INTERVAL '24 hours', 6, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Pottery Workshop — Beginners Welcome', 'Try your hand at the wheel. No experience needed!', 'Turning Earth', 'Hoxton, London N1', 51.5308, -0.0762, NOW() + INTERVAL '48 hours', 10, 'request', 'everyone', 'active');
  END IF;

  -- =====================
  -- ENTERTAINMENT
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'entertainment';
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE name = 'Movies';
  END IF;
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Live Jazz Night', 'World-class jazz in Soho. Drinks available.', 'Ronnie Scott''s', 'Frith St, Soho, London W1', 51.5133, -0.1318, NOW() + INTERVAL '9 hours', 50, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Rooftop Cinema — Gladiator II', 'Outdoor screening on the Peckham rooftop. Bring a blanket!', 'Bussey Building Rooftop', 'Rye Ln, Peckham, London SE15', 51.4686, -0.0679, NOW() + INTERVAL '32 hours', 60, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Comedy Night — Open Mic', 'Free entry comedy. Come laugh (or perform)!', 'Angel Comedy Club', 'Camden Passage, Angel, London N1', 51.5320, -0.1058, NOW() + INTERVAL '11 hours', 40, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Karaoke Night — Private Room', 'Booked a room at Lucky Voice. Need more singers!', 'Lucky Voice', 'Soho, London W1', 51.5140, -0.1340, NOW() + INTERVAL '9 hours 30 minutes', 8, 'request', 'everyone', 'active');
  END IF;

  -- =====================
  -- LEARNING
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'learning';
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE name = 'Language Exchange';
  END IF;
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Language Exchange — Spanish/English', 'Practice your Spanish over drinks. Native speakers welcome!', 'The Book Club', 'Leonard St, Shoreditch, London EC2', 51.5258, -0.0811, NOW() + INTERVAL '10 hours', 6, 'request', 'everyone', 'active');
  END IF;

  -- =====================
  -- SOCIAL
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'social';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Sunday Market — Vintage & Street Food', 'Exploring Brick Lane Market. Meet at the entrance!', 'Brick Lane Market', 'Brick Lane, London E1', 51.5215, -0.0715, NOW() + INTERVAL '44 hours', 100, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Networking Drinks — Tech & Startups', 'Informal drinks for anyone in tech. No pitching, just vibes.', 'The Hoxton Hotel', 'Great Eastern St, Shoreditch, London EC2', 51.5260, -0.0815, NOW() + INTERVAL '7 hours 30 minutes', 15, 'auto', 'everyone', 'active');
  END IF;

  -- =====================
  -- PETS
  -- =====================
  SELECT id INTO v_cat_id FROM categories WHERE value = 'pets';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Dog Walk in the Park', 'Morning walk with the pups. All breeds welcome!', 'Battersea Park', 'Battersea Park, London SW11', 51.4794, -0.1564, NOW() + INTERVAL '8 hours', 5, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Pet Cafe Visit — Dogs Welcome', 'Cute cafe with treats for dogs and humans.', 'Paws & Coffee', 'Clapham Common, London SW4', 51.4618, -0.1386, NOW() + INTERVAL '6 hours 30 minutes', 4, 'request', 'everyone', 'active');
  END IF;

  RAISE NOTICE 'Successfully created London demo events for user %', v_host_id;
END $$;
