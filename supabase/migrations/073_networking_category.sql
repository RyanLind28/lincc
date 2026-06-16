-- 073: Promote "Networking" to a top-level category
--
-- Networking previously existed only as the `social-networking` subcategory under
-- Social. This migration adds a top-level Networking category (and matching
-- subcategories) so it can be selected on its own when creating events, filtered
-- on the Home map, and browsed on Explore. The static mirror lives in
-- src/data/categories.ts.

-- Top-level category. createEvent() resolves categories by name (ILIKE), HomePage
-- filters on `value`, so both must match the static array exactly.
INSERT INTO categories (name, value, icon, sort_order, is_active, parent_id)
SELECT 'Networking', 'networking', 'Handshake', 26, true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE value = 'networking' AND parent_id IS NULL
);

-- Subcategories, parented to the row above.
WITH parent AS (
  SELECT id FROM categories WHERE value = 'networking' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, value, icon, sort_order, is_active, parent_id, image)
SELECT v.name, v.value, 'Handshake', v.sort_order, true, parent.id, v.image
FROM parent,
  (VALUES
    ('Professional meetup',  'networking-professional', 1, 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=400&h=300&fit=crop'),
    ('Startup & founders',   'networking-startup',      2, 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop'),
    ('Tech meetup',          'networking-tech',         3, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'),
    ('Creative networking',  'networking-creative',     4, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop')
  ) AS v(name, value, sort_order, image)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.value = v.value);
