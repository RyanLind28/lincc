-- Example Events for Testing
-- Creates events for each category with various settings
-- Host: ryanlindie@gmail.com

DO $$
DECLARE
  v_host_id UUID;
  v_cat_id UUID;
  v_base_time TIMESTAMPTZ := NOW() + INTERVAL '2 hours';
BEGIN
  -- Get host user ID
  SELECT id INTO v_host_id FROM profiles WHERE email = 'ryanlindie@gmail.com';

  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'User ryanlindie@gmail.com not found. Please sign up first.';
  END IF;

  -- Coffee events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Coffee';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Morning Coffee Chat', 'Looking for someone to chat with over coffee!', 'Blue Bottle Coffee', '123 Main St, San Francisco', 37.7749, -122.4194, v_base_time, 2, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Work From Cafe Session', 'Coworking at a cozy cafe', 'Philz Coffee', '456 Market St, San Francisco', 37.7899, -122.4000, v_base_time + INTERVAL '1 day', 4, 'auto', 'everyone', 'active');
  END IF;

  -- Food & Drinks events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Food & Drinks';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Taco Tuesday', 'Best tacos in the city!', 'La Taqueria', '2889 Mission St, San Francisco', 37.7516, -122.4180, v_base_time + INTERVAL '2 hours', 4, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Wine Tasting Evening', 'Exploring local wines', 'The Wine Bar', '789 Valencia St, San Francisco', 37.7599, -122.4210, v_base_time + INTERVAL '2 days', 6, 'request', 'everyone', 'active');
  END IF;

  -- Sports events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Sports';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Tennis Doubles Match', 'Looking for a doubles partner!', 'Golden Gate Park Tennis Courts', 'Golden Gate Park, San Francisco', 37.7694, -122.4862, v_base_time + INTERVAL '3 hours', 3, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Basketball Pickup Game', 'Casual 3v3 game', 'Dolores Park Basketball Courts', 'Dolores Park, San Francisco', 37.7596, -122.4269, v_base_time + INTERVAL '1 day 2 hours', 5, 'auto', 'everyone', 'active');
  END IF;

  -- Fitness events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Fitness';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Morning Gym Session', 'Strength training workout', 'Equinox Fitness', '50 California St, San Francisco', 37.7936, -122.3980, v_base_time + INTERVAL '14 hours', 2, 'request', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'CrossFit WOD', 'High intensity workout', 'CrossFit SF', '1234 Howard St, San Francisco', 37.7774, -122.4130, v_base_time + INTERVAL '1 day 6 hours', 4, 'auto', 'everyone', 'active');
  END IF;

  -- Hiking events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Hiking';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Lands End Trail Hike', 'Scenic coastal hike with amazing views', 'Lands End Trailhead', 'Lands End, San Francisco', 37.7847, -122.5048, v_base_time + INTERVAL '1 day', 6, 'request', 'everyone', 'active');
  END IF;

  -- Gaming events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Gaming';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Board Game Night', 'Settlers of Catan and more!', 'Game Parlour', '567 Divisadero St, San Francisco', 37.7749, -122.4384, v_base_time + INTERVAL '4 hours', 5, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Mario Kart Tournament', 'Competitive racing fun', 'My Place', '890 Hayes St, San Francisco', 37.7760, -122.4285, v_base_time + INTERVAL '2 days', 4, 'request', 'everyone', 'active');
  END IF;

  -- Movies events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Movies';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Indie Film Screening', 'Watching the latest indie releases', 'Alamo Drafthouse', '2550 Mission St, San Francisco', 37.7566, -122.4189, v_base_time + INTERVAL '5 hours', 3, 'request', 'everyone', 'active');
  END IF;

  -- Yoga & Wellness events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Yoga & Wellness';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Sunrise Yoga in the Park', 'Start your day with mindfulness', 'Dolores Park', 'Dolores Park, San Francisco', 37.7596, -122.4269, v_base_time + INTERVAL '12 hours', 8, 'auto', 'everyone', 'active'),
      (v_host_id, v_cat_id, 'Women''s Meditation Circle', 'Safe space for mindfulness practice', 'Zen Center', '300 Page St, San Francisco', 37.7730, -122.4280, v_base_time + INTERVAL '1 day 3 hours', 6, 'request', 'women', 'active');
  END IF;

  -- Art & Culture events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Art & Culture';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'SFMOMA Visit', 'Exploring modern art together', 'SFMOMA', '151 3rd St, San Francisco', 37.7857, -122.4011, v_base_time + INTERVAL '3 days', 4, 'request', 'everyone', 'active');
  END IF;

  -- Pets events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Pets';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Dog Park Playdate', 'Let our pups play together!', 'Duboce Park Dog Run', 'Duboce Park, San Francisco', 37.7692, -122.4334, v_base_time + INTERVAL '4 hours', 4, 'auto', 'everyone', 'active');
  END IF;

  -- Study & Work events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Study & Work';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Coworking at Library', 'Productive work session together', 'SF Public Library', '100 Larkin St, San Francisco', 37.7790, -122.4157, v_base_time + INTERVAL '20 hours', 3, 'auto', 'everyone', 'active');
  END IF;

  -- Language Exchange events
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Language Exchange';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO events (host_id, category_id, title, description, venue_name, venue_address, venue_lat, venue_lng, start_time, capacity, join_mode, audience, status)
    VALUES
      (v_host_id, v_cat_id, 'Spanish-English Exchange', 'Practice conversation skills', 'Cafe La Boheme', '3318 24th St, San Francisco', 37.7524, -122.4195, v_base_time + INTERVAL '1 day 5 hours', 4, 'request', 'everyone', 'active');
  END IF;

  RAISE NOTICE 'Successfully created example events for user %', v_host_id;
END $$;
