import { logger } from '../lib/utils';
// Voucher service — fetch, redeem, and query vouchers

import { supabase } from '../lib/supabase';
import { cached, invalidatePrefix } from '../lib/cache';
import type { VoucherWithDetails } from '../types';

/**
 * Fetch all active, non-expired vouchers with business profile + category
 */
export async function getActiveVouchers(): Promise<VoucherWithDetails[]> {
  return cached('vouchers:active', async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        business:businesses!business_id(*),
        category:categories!category_id(*)
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
      business:businesses!business_id(*),
      category:categories!category_id(*)
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
 * Get vouchers near a location (Haversine filter)
 */
export async function getNearbyVouchers(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<VoucherWithDetails[]> {
  const allVouchers = await getActiveVouchers();

  return allVouchers.filter((v) => {
    const distance = haversineDistance(lat, lng, v.venue_lat, v.venue_lng);
    return distance <= radiusKm;
  });
}

/**
 * Fetch ALL vouchers by a business (any status) — for the business owner's profile
 */
export async function getVouchersByBusiness(businessId: string): Promise<VoucherWithDetails[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*),
      category:categories!category_id(*)
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
 * Fetch active vouchers by a business — for public display on their profile
 */
export async function getActiveVouchersByBusiness(businessId: string): Promise<VoucherWithDetails[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      business:businesses!business_id(*),
      category:categories!category_id(*)
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

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
