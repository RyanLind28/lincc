-- 052_enforce_capacity_and_redemptions.sql
-- Backend enforcement for two UI gates that previously had no DB-side check.
--   1. atomic redeem_voucher() RPC -- validates status/expiry/limit + does the
--      INSERT + UPDATE in one locked transaction (was a race-y two-step in
--      voucherService.redeemVoucher with a missing RPC fallback)
--   2. event capacity trigger -- blocks INSERTs/UPDATEs that would push the
--      approved participant count past events.capacity

-- ============================================================
-- 1. Atomic voucher redemption
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_voucher(voucher_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count int;
  v_limit int;
  v_status text;
  v_expires_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  -- Lock the voucher row for the duration of the transaction so a parallel
  -- redemption can't slip in between the limit check and the count bump.
  SELECT redemption_count, redemption_limit, status, expires_at
  INTO v_count, v_limit, v_status, v_expires_at
  FROM public.vouchers
  WHERE id = voucher_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'voucher_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'voucher_inactive' USING ERRCODE = 'P0001';
  END IF;

  IF v_expires_at < NOW() THEN
    RAISE EXCEPTION 'voucher_expired' USING ERRCODE = 'P0001';
  END IF;

  IF v_limit IS NOT NULL AND v_count >= v_limit THEN
    RAISE EXCEPTION 'voucher_exhausted' USING ERRCODE = 'P0001';
  END IF;

  -- Insert the redemption record; UNIQUE(voucher_id, user_id) catches double-claim
  BEGIN
    INSERT INTO public.voucher_redemptions (voucher_id, user_id)
    VALUES (voucher_id_input, v_user_id);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'already_redeemed' USING ERRCODE = 'P0001';
  END;

  UPDATE public.vouchers
  SET redemption_count = redemption_count + 1
  WHERE id = voucher_id_input;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_voucher(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(uuid) TO authenticated;

-- ============================================================
-- 2. Event capacity trigger
-- ============================================================
-- Fires before INSERT (someone joining) or before UPDATE that transitions to
-- 'approved' (host approving a pending request). Re-uses participant_count
-- column for speed but falls back to a COUNT(*) so the gate stays correct
-- even if the cached count drifts (we had a bug like that in migration 042).

CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_approved int;
BEGIN
  -- Only care when the row IS or BECOMES an approved participant
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    -- Already counted; no transition
    RETURN NEW;
  END IF;

  SELECT capacity INTO v_capacity FROM public.events WHERE id = NEW.event_id;
  IF v_capacity IS NULL THEN
    -- Event not found (shouldn't happen via FK), let downstream fail
    RETURN NEW;
  END IF;

  -- Count current approved excluding the row we're about to write/update
  SELECT COUNT(*) INTO v_approved
  FROM public.event_participants
  WHERE event_id = NEW.event_id
    AND status = 'approved'
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF v_approved >= v_capacity THEN
    RAISE EXCEPTION 'event_full' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_event_capacity_trigger ON public.event_participants;
CREATE TRIGGER enforce_event_capacity_trigger
  BEFORE INSERT OR UPDATE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_event_capacity();
