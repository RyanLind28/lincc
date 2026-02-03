-- Fixes for MVP features
-- Run AFTER 001 and 002

-- ===========================================
-- FIX CAPACITY CONSTRAINT
-- ===========================================

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_capacity_check;
ALTER TABLE events ADD CONSTRAINT events_capacity_check
  CHECK (capacity >= 1 AND capacity <= 15);

-- ===========================================
-- UPDATE CATEGORY ICONS TO LUCIDE NAMES
-- ===========================================

UPDATE categories SET icon = 'Coffee' WHERE name = 'Coffee';
UPDATE categories SET icon = 'Utensils' WHERE name = 'Food & Drinks';
UPDATE categories SET icon = 'Trophy' WHERE name = 'Sports';
UPDATE categories SET icon = 'Dumbbell' WHERE name = 'Fitness';
UPDATE categories SET icon = 'Footprints' WHERE name = 'Walking';
UPDATE categories SET icon = 'Mountain' WHERE name = 'Hiking';
UPDATE categories SET icon = 'PersonStanding' WHERE name = 'Running';
UPDATE categories SET icon = 'Bike' WHERE name = 'Cycling';
UPDATE categories SET icon = 'Gamepad2' WHERE name = 'Gaming';
UPDATE categories SET icon = 'Film' WHERE name = 'Movies';
UPDATE categories SET icon = 'Music' WHERE name = 'Music';
UPDATE categories SET icon = 'Palette' WHERE name = 'Art & Culture';
UPDATE categories SET icon = 'BookOpen' WHERE name = 'Study & Work';
UPDATE categories SET icon = 'Languages' WHERE name = 'Language Exchange';
UPDATE categories SET icon = 'Dices' WHERE name = 'Board Games';
UPDATE categories SET icon = 'Heart' WHERE name = 'Yoga & Wellness';
UPDATE categories SET icon = 'Dog' WHERE name = 'Pets';
UPDATE categories SET icon = 'Camera' WHERE name = 'Photography';
UPDATE categories SET icon = 'ShoppingBag' WHERE name = 'Shopping';
UPDATE categories SET icon = 'Umbrella' WHERE name = 'Beach';
UPDATE categories SET icon = 'MoreHorizontal' WHERE name = 'Other';

-- ===========================================
-- ADD MISSING CATEGORIES FROM FRONTEND
-- ===========================================

-- Insert categories that exist in frontend but not in DB
INSERT INTO categories (name, icon, value, sort_order, is_active) VALUES
  ('Outdoors', 'TreePine', 'outdoors', 22, true),
  ('Wellness', 'Heart', 'wellness', 23, true),
  ('Entertainment', 'Film', 'entertainment', 24, true),
  ('Creative', 'Palette', 'creative', 25, true),
  ('Learning', 'BookOpen', 'learning', 26, true),
  ('Social', 'PartyPopper', 'social', 27, true)
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, value = EXCLUDED.value;

-- Update values for existing categories to match frontend
UPDATE categories SET value = 'coffee' WHERE name = 'Coffee' AND value IS DISTINCT FROM 'coffee';
UPDATE categories SET value = 'food' WHERE name = 'Food & Drinks' AND value IS DISTINCT FROM 'food';
UPDATE categories SET value = 'sports' WHERE name = 'Sports' AND value IS DISTINCT FROM 'sports';
UPDATE categories SET value = 'fitness' WHERE name = 'Fitness' AND value IS DISTINCT FROM 'fitness';
UPDATE categories SET value = 'gaming' WHERE name = 'Gaming' AND value IS DISTINCT FROM 'gaming';
UPDATE categories SET value = 'pets' WHERE name = 'Pets' AND value IS DISTINCT FROM 'pets';
