-- 057_drop_orphaned_voucher_seed.sql
-- The seed block at the bottom of migration 016 inserted demo vouchers with
-- business_id pointing at the owner's profile. Migration 033 renamed that
-- column to legacy_business_id and later work dropped it, leaving the rows
-- with NULL business_id and no way to expose them via the UI (which always
-- joins on businesses). They are all expired by now anyway.

DELETE FROM vouchers WHERE business_id IS NULL;
