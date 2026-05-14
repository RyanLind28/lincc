import { logger } from '../lib/utils';
// Voucher service — fetch, redeem, and query vouchers

import { supabase } from '../lib/supabase';
import { cached, invalidatePrefix } from '../lib/cache';
import type { VoucherWithDetails } from '../types';

/**
 * Fetch all active, non-expired vouchers with their business profile
 */
export async function getActiveVouchers(): Promise<VoucherWithDetails[]> {
  return cached('vouchers:active', async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        business:businesses!business_id(*)
`)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching vouchers:', error);
      return [];
    }

    return (data || []) as unknown as VoucherWithDetails[];
  }, 30_000);
}

/**
 * Get a single voucher by ID with full details
 */
export async function getVoucherById(id: string): Promise<VoucherWithDetails | null> {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*)
`)
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching voucher:', error);
    return null;
  }

  return data as unknown as VoucherWithDetails;
}

// Maps the SQLSTATE / message strings raised by redeem_voucher() to friendly UI copy.
// Anything not in this map falls through to a generic error.
const REDEEM_ERROR_MESSAGES: Record<string, string> = {
  voucher_not_found: "This voucher no longer exists.",
  voucher_inactive: "This voucher isn't active right now.",
  voucher_expired: "This voucher has expired.",
  voucher_exhausted: "All vouchers have been claimed.",
  already_redeemed: "You've already redeemed this voucher.",
  not_authenticated: "Sign in to redeem this voucher.",
};

/**
 * Redeem a voucher for a user. Backed by the atomic redeem_voucher() RPC
 * which holds a row lock for the duration of the limit-check + insert +
 * count-bump, so two clients can't push the redemption past the cap.
 */
export async function redeemVoucher(
  voucherId: string,
  _userId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('redeem_voucher', { voucher_id_input: voucherId });

  if (error) {
    // The RPC RAISEs with a stable string in error.message ("voucher_expired" etc.)
    const friendly = REDEEM_ERROR_MESSAGES[error.message] ?? null;
    if (!friendly) logger.error('Error redeeming voucher:', error);
    return { success: false, error: friendly ?? 'Could not redeem this voucher.' };
  }

  invalidatePrefix('vouchers:');
  return { success: true };
}

/**
 * Check if a user has already redeemed a voucher
 */
export async function hasUserRedeemed(voucherId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('voucher_redemptions')
    .select('id')
    .eq('voucher_id', voucherId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/**
 * Fetch ALL vouchers by a business (any status) — for the business owner's profile
 */
export async function getVouchersByBusiness(businessId: string): Promise<VoucherWithDetails[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*)
`)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching business vouchers:', error);
    return [];
  }

  return (data || []) as unknown as VoucherWithDetails[];
}

/**
 * Fetch active vouchers for many businesses in a single query and group by
 * business_id. Used by the directory page so it doesn't N+1 a request per
 * business per keystroke.
 */
export async function getActiveVouchersForBusinesses(
  businessIds: string[],
): Promise<Record<string, VoucherWithDetails[]>> {
  if (businessIds.length === 0) return {};

  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*)
`)
    .in('business_id', businessIds)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching vouchers for businesses:', error);
    return {};
  }

  const grouped: Record<string, VoucherWithDetails[]> = {};
  for (const row of (data || []) as unknown as VoucherWithDetails[]) {
    (grouped[row.business_id] ??= []).push(row);
  }
  return grouped;
}

/**
 * Fetch active vouchers by a business — for public display on their profile
 */
export async function getActiveVouchersByBusiness(businessId: string): Promise<VoucherWithDetails[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*)
`)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching active business vouchers:', error);
    return [];
  }

  return (data || []) as unknown as VoucherWithDetails[];
}

