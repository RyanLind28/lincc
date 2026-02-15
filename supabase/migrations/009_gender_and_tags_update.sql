-- 009: Update gender enum (remove non-binary, rename woman→female, man→male) + remove tags limit
-- Required by: Onboarding flow changes

-- 1. Update gender enum values
-- PostgreSQL doesn't allow renaming enum values directly, so we need to:
-- a) Create new enum, b) Migrate column, c) Drop old enum

-- Create the new enum
CREATE TYPE user_gender_new AS ENUM ('female', 'male');

-- Migrate existing data: update profiles column to use new type
ALTER TABLE profiles
  ALTER COLUMN gender TYPE user_gender_new
  USING CASE
    WHEN gender::text = 'woman' THEN 'female'::user_gender_new
    WHEN gender::text = 'man' THEN 'male'::user_gender_new
    WHEN gender::text = 'non-binary' THEN 'male'::user_gender_new  -- Default non-binary to male for migration
  END;

-- Drop old enum and rename new one
DROP TYPE user_gender;
ALTER TYPE user_gender_new RENAME TO user_gender;

-- 2. Remove the 3-tag limit on profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tags_check;
