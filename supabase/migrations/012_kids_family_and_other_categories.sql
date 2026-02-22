-- Migration: Add "Kids & Family" and "Other" categories
-- Also adds custom_category column to events for "Other" free-text input

-- 1. Add custom_category column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_category TEXT DEFAULT NULL;

-- 2. Insert "Kids & Family" category
INSERT INTO categories (name, icon, value, sort_order, is_active) VALUES
  ('Kids & Family', 'Baby', 'kids-family', 28, true)
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, value = EXCLUDED.value, sort_order = EXCLUDED.sort_order;

-- 3. Insert "Other" category (always last)
INSERT INTO categories (name, icon, value, sort_order, is_active) VALUES
  ('Other', 'Ellipsis', 'other', 99, true)
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, value = EXCLUDED.value, sort_order = EXCLUDED.sort_order;
