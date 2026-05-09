-- 049_profile_name_unique.sql
--
-- Enforce case-insensitive, whitespace-trimmed uniqueness on profiles.profile_name
-- so two users can't end up with identical-looking usernames (e.g. "Tami" and "tami").
-- Indexed expression rather than a plain UNIQUE column so the comparison is
-- normalised; partial WHERE skips the trigger's empty-string default in the
-- (defensive) case where a row slips through with a blank profile_name.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_profile_name_unique_ci
  ON profiles (lower(trim(profile_name)))
  WHERE profile_name IS NOT NULL AND trim(profile_name) <> '';
