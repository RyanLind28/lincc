-- 056_voucher_expiry_and_redemption_notifications.sql
-- Flip vouchers to status='expired' once expires_at has passed (mirrors the
-- events cron from migration 007), and notify the business owner whenever
-- someone redeems one of their vouchers.

-- ============================================================
-- 1. Voucher expiry
-- ============================================================
CREATE OR REPLACE FUNCTION expire_past_vouchers()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE vouchers
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop any existing schedule so re-running this migration replaces it
    PERFORM cron.unschedule('expire-past-vouchers')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-past-vouchers');

    PERFORM cron.schedule(
      'expire-past-vouchers',
      '*/5 * * * *',
      $cron$SELECT public.expire_past_vouchers()$cron$
    );
  END IF;
END
$$;

-- ============================================================
-- 2. Redemption notifications
-- ============================================================
-- Fire a notification to the business owner whenever someone redeems one of
-- their vouchers. Uses the existing create_notification() helper so the row
-- lands in `notifications` AND triggers a push delivery.

CREATE OR REPLACE FUNCTION notify_voucher_redeemed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id    uuid;
  v_voucher_title text;
  v_redeemer_name text;
BEGIN
  SELECT b.owner_id, v.title
    INTO v_owner_id, v_voucher_title
  FROM vouchers v
  JOIN businesses b ON b.id = v.business_id
  WHERE v.id = NEW.voucher_id;

  -- Owner-less or self-redemption: no notification needed
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name), ''), 'Someone')
    INTO v_redeemer_name
  FROM profiles
  WHERE id = NEW.user_id;

  PERFORM create_notification(
    v_owner_id,
    'voucher_redeemed',
    'Voucher redeemed',
    v_redeemer_name || ' redeemed "' || v_voucher_title || '"',
    jsonb_build_object('voucher_id', NEW.voucher_id, 'redeemer_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_voucher_redeemed ON voucher_redemptions;
CREATE TRIGGER on_voucher_redeemed
  AFTER INSERT ON voucher_redemptions
  FOR EACH ROW EXECUTE FUNCTION notify_voucher_redeemed();

-- ============================================================
-- 3. Realtime publication
-- ============================================================
-- Wrap in DO block so re-running is idempotent (ADD TABLE errors if already present).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'voucher_redemptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE voucher_redemptions;
  END IF;
END
$$;
