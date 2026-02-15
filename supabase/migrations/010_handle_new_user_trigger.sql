-- 010: Auto-create profiles row on user signup
-- This is the standard Supabase pattern — creates a minimal profile row
-- when a new user signs up, so UPDATE operations in onboarding work.

-- 1. Allow first_name and dob to have defaults for the initial row
ALTER TABLE profiles ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE profiles ALTER COLUMN dob SET DEFAULT '2000-01-01';
ALTER TABLE profiles ALTER COLUMN gender SET DEFAULT 'male';

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: create profile rows for any auth users that don't have one
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
