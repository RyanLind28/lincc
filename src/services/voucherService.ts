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
        business:profiles!business_id(*),
        category:categories!category_id(*)
      `)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vouchers:', error);
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
      business:profiles!business_id(*),
      category:categories!category_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching voucher:', error);
    return null;
  }

  return data as unknown as VoucherWithDetails;
}

/**
 * Redeem a voucher for a user
 */
export async function redeemVoucher(
  voucherId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Insert redemption record
  const { error: insertError } = await supabase
    .from('voucher_redemptions')
    .insert({ voucher_id: voucherId, user_id: userId });

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'You have already redeemed this voucher.' };
    }
    console.error('Error redeeming voucher:', insertError);
    return { success: false, error: insertError.message };
  }

  // Increment redemption_count on the voucher
  const { error: updateError } = await supabase.rpc('increment_redemption_count', {
    voucher_id_input: voucherId,
  });

  // If RPC doesn't exist, fall back to manual update
  if (updateError) {
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('redemption_count')
      .eq('id', voucherId)
      .single();

    if (voucher) {
      await supabase
        .from('vouchers')
        .update({ redemption_count: (voucher.redemption_count || 0) + 1 })
        .eq('id', voucherId);
    }
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
      business:profiles!business_id(*),
      category:categories!category_id(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching business vouchers:', error);
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
      business:profiles!business_id(*),
      category:categories!category_id(*)
    `)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active business vouchers:', error);
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
