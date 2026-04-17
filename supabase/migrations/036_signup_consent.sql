-- 036: Persist signup consent (terms + 18+) to profile on user creation
-- SignupPage passes terms_accepted_at (ISO string) and age_confirmed (bool)
-- via supabase.auth.signUp options.data; we copy them into the profiles row
-- so the post-signup /terms page can be skipped for consenting users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_terms_accepted_at TIMESTAMPTZ;
  v_is_business BOOLEAN;
BEGIN
  -- Parse ISO string from raw_user_meta_data.terms_accepted_at if present
  BEGIN
    v_terms_accepted_at := (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    v_terms_accepted_at := NULL;
  END;

  v_is_business := COALESCE((NEW.raw_user_meta_data->>'is_business')::BOOLEAN, FALSE);

  INSERT INTO public.profiles (id, email, terms_accepted_at, is_business)
  VALUES (NEW.id, NEW.email, v_terms_accepted_at, v_is_business)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
