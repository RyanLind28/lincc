-- 063: Capture city on waitlist signups.
-- Lincc launches in Sheffield first and expands city by city, so knowing where
-- demand is concentrated tells us where to go next. Optional free text; the
-- landing forms suggest Sheffield but don't force it. Additive and nullable, so
-- existing rows and the anon INSERT policy are unaffected.
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS city TEXT;
