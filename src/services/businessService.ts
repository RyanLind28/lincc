import { logger } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { Business, BusinessWithOwner, BusinessLocation, BusinessOpeningHours } from '../types';

interface ServiceResult {
  success: boolean;
  error?: string;
}

/**
 * Update an existing business (owner only — RLS enforces).
 */
export async function updateBusiness(
  businessId: string,
  data: Partial<{
    name: string;
    category: string;
    description: string | null;
    address: string | null;
    logo_url: string | null;
    opening_hours: BusinessOpeningHours | null;
  }>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('businesses')
    .update(data)
    .eq('id', businessId);

  if (error) {
    logger.error('Error updating business:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Owner moves a rejected application back into pending. Called from the
 * pending-approval page after edits.
 */
export async function resubmitBusiness(businessId: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('businesses')
    .update({ status: 'pending_approval', rejection_reason: null })
    .eq('id', businessId)
    .eq('status', 'rejected');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get a business by ID OR slug. The same route serves both:
 * /business/<uuid> works for back-compat, /business/<slug> is the canonical form.
 */
export async function getBusinessById(idOrSlug: string): Promise<BusinessWithOwner | null> {
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug';
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      owner:profiles!owner_id(*)
    `)
    .eq(column, idOrSlug)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching business:', error);
    return null;
  }

  return (data as BusinessWithOwner | null) ?? null;
}

/**
 * Build the public URL for a business (slug if present, falls back to id).
 */
export function businessHref(business: { id: string; slug?: string | null } | null | undefined): string {
  if (!business) return '/businesses';
  return `/business/${business.slug || business.id}`;
}

/**
 * Get the single business owned by this account (one-per-account model).
 */
export async function getBusinessForOwner(ownerId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching owner business:', error);
    return null;
  }

  return (data ?? null) as Business | null;
}

/**
 * Get approved businesses for the public directory.
 */
export async function getActiveBusinesses(
  query?: string,
  category?: string,
  limit = 30
): Promise<Business[]> {
  let q = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'approved')
    .order('name', { ascending: true })
    .limit(limit);

  if (category) {
    q = q.eq('category', category);
  }
  if (query) {
    q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) {
    logger.error('Error fetching approved businesses:', error);
    return [];
  }
  return data as Business[];
}

// ---- Location CRUD ----

export async function getLocationsByBusiness(businessId: string): Promise<BusinessLocation[]> {
  const { data, error } = await supabase
    .from('business_locations')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('is_primary', { ascending: false });
  if (error) {
    logger.error('Error fetching locations:', error);
    return [];
  }
  return data as BusinessLocation[];
}

export async function addLocation(
  businessId: string,
  locationData: { name: string; address: string; lat: number; lng: number; is_primary?: boolean }
): Promise<{ success: boolean; error?: string; data?: BusinessLocation }> {
  const { data: location, error } = await supabase
    .from('business_locations')
    .insert({
      business_id: businessId,
      name: locationData.name,
      address: locationData.address,
      lat: locationData.lat,
      lng: locationData.lng,
      is_primary: locationData.is_primary ?? false,
    })
    .select()
    .single();
  if (error) {
    logger.error('Error adding location:', error);
    return { success: false, error: error.message };
  }
  return { success: true, data: location as BusinessLocation };
}

export async function deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('business_locations')
    .delete()
    .eq('id', locationId);
  if (error) {
    logger.error('Error deleting location:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ---- Public profile data ----

export interface BusinessPublicEvent {
  id: string;
  title: string;
  start_time: string;
  capacity: number;
  cover_image_url: string | null;
  venue_name: string;
  status: string;
  participant_count: number;
}

export interface BusinessPublicReview {
  id: string;
  host_rating: number;
  event_rating: number;
  comment: string | null;
  created_at: string;
  host_reply: string | null;
  guest: { first_name: string; avatar_url: string | null } | null;
}

export async function getBusinessPublicData(businessId: string): Promise<{
  events: BusinessPublicEvent[];
  reviews: BusinessPublicReview[];
  stats: { hostRatingAvg: number | null; reviewCount: number; eventsHosted: number };
}> {
  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_time, capacity, cover_image_url, venue_name, status, participant_count:event_participants(count)')
    .eq('business_id', businessId)
    .in('status', ['active', 'full', 'expired'])
    .order('start_time', { ascending: false })
    .limit(20);

  const eventList = (events ?? []).map((e: { participant_count?: { count: number }[] | { count: number } } & BusinessPublicEvent) => ({
    id: e.id,
    title: e.title,
    start_time: e.start_time,
    capacity: e.capacity,
    cover_image_url: e.cover_image_url,
    venue_name: e.venue_name,
    status: e.status,
    participant_count: Array.isArray(e.participant_count)
      ? (e.participant_count[0]?.count ?? 0)
      : (e.participant_count?.count ?? 0),
  })) as BusinessPublicEvent[];

  const eventIds = eventList.map((e) => e.id);
  const { data: reviews } = eventIds.length
    ? await supabase
        .from('host_reviews')
        .select('id, host_rating, event_rating, comment, created_at, host_reply, guest:profiles!host_reviews_guest_id_fkey(first_name, avatar_url)')
        .in('event_id', eventIds)
        .eq('is_disputed', false)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };

  const reviewList = (reviews ?? []) as unknown as BusinessPublicReview[];
  const ratingTotal = reviewList.reduce((s, r) => s + r.host_rating, 0);

  return {
    events: eventList,
    reviews: reviewList,
    stats: {
      hostRatingAvg: reviewList.length ? Math.round((ratingTotal / reviewList.length) * 10) / 10 : null,
      reviewCount: reviewList.length,
      eventsHosted: eventList.length,
    },
  };
}

// ---- Dashboard data ----

export interface BusinessDashboardEvent {
  id: string;
  title: string;
  status: string;
  start_time: string;
  capacity: number;
  participant_count: number;
  cover_image_url: string | null;
}

export interface BusinessDashboardActivity {
  id: string;
  type: 'redemption' | 'join' | 'review';
  occurred_at: string;
  label: string;
  detail?: string | null;
}

export interface BusinessDashboardData {
  locations: BusinessLocation[];
  events: BusinessDashboardEvent[];
  vouchers: Array<{
    id: string;
    title: string;
    discount_text: string;
    status: string;
    expires_at: string | null;
    redemption_count: number;
    redemption_limit: number | null;
    created_at: string;
    cover_image_url: string | null;
  }>;
  stats: {
    activeEvents: number;
    pastEvents: number;
    totalParticipants: number;
    activeVouchers: number;
    totalRedemptions: number;
    hostRatingAvg: number | null;
    hostRatingCount: number;
    eventRatingAvg: number | null;
    eventRatingCount: number;
  };
  recentActivity: BusinessDashboardActivity[];
  recentHostReviews: Array<{
    id: string;
    host_rating: number;
    event_rating: number;
    comment: string | null;
    created_at: string;
    host_reply: string | null;
    is_disputed: boolean;
    guest: { first_name: string; avatar_url: string | null } | null;
  }>;
}

export async function getBusinessDashboardData(businessId: string): Promise<BusinessDashboardData> {
  const [locsRes, eventsRes, vouchersRes] = await Promise.all([
    supabase
      .from('business_locations')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false }),
    supabase
      .from('events')
      .select('id, title, status, start_time, capacity, cover_image_url, participant_count:event_participants(count)')
      .eq('business_id', businessId)
      .order('start_time', { ascending: false })
      .limit(50),
    supabase
      .from('vouchers')
      .select('id, title, discount_text, status, expires_at, redemption_count, redemption_limit, created_at, cover_image_url')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
  ]);

  const events = (eventsRes.data ?? []).map((e: { participant_count?: { count: number }[] | { count: number } } & BusinessDashboardEvent) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    start_time: e.start_time,
    capacity: e.capacity,
    cover_image_url: e.cover_image_url,
    participant_count: Array.isArray(e.participant_count)
      ? (e.participant_count[0]?.count ?? 0)
      : (e.participant_count?.count ?? 0),
  })) as BusinessDashboardEvent[];

  const vouchers = vouchersRes.data ?? [];

  // Reviews (host-side reviews left by guests after attending this business's events)
  const eventIds = events.map((e) => e.id);
  const reviewsRes = eventIds.length
    ? await supabase
        .from('host_reviews')
        .select('id, host_rating, event_rating, comment, created_at, host_reply, is_disputed, guest:profiles!host_reviews_guest_id_fkey(first_name, avatar_url)')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };

  const reviews = (reviewsRes.data ?? []) as unknown as BusinessDashboardData['recentHostReviews'];

  const hostRatingTotal = reviews.reduce((s, r) => s + r.host_rating, 0);
  const eventRatingTotal = reviews.reduce((s, r) => s + r.event_rating, 0);

  // Recent activity feed: redemptions + joins + reviews, last 10
  const voucherIds = vouchers.map((v) => v.id);
  const [redemptionsRes, joinsRes] = await Promise.all([
    voucherIds.length
      ? supabase
          .from('voucher_redemptions')
          .select('id, redeemed_at, voucher:vouchers!voucher_id(title), user:profiles!voucher_redemptions_user_id_fkey(first_name)')
          .in('voucher_id', voucherIds)
          .order('redeemed_at', { ascending: false })
          .limit(10)
      : { data: [] },
    eventIds.length
      ? supabase
          .from('event_participants')
          .select('id, status, created_at, event:events!event_id(title), user:profiles!event_participants_user_id_fkey(first_name)')
          .in('event_id', eventIds)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [] },
  ]);

  type RedemptionRow = { id: string; redeemed_at: string; voucher: { title: string } | null; user: { first_name: string } | null };
  type JoinRow = { id: string; created_at: string; event: { title: string } | null; user: { first_name: string } | null };
  type ReviewRow = { id: string; created_at: string; host_rating: number; comment: string | null; guest: { first_name: string } | null };

  const redemptionActivity: BusinessDashboardActivity[] = ((redemptionsRes.data ?? []) as unknown as RedemptionRow[]).map((r) => ({
    id: `red-${r.id}`,
    type: 'redemption' as const,
    occurred_at: r.redeemed_at,
    label: `${r.user?.first_name ?? 'Someone'} redeemed ${r.voucher?.title ?? 'a voucher'}`,
  }));
  const joinActivity: BusinessDashboardActivity[] = ((joinsRes.data ?? []) as unknown as JoinRow[]).map((j) => ({
    id: `join-${j.id}`,
    type: 'join' as const,
    occurred_at: j.created_at,
    label: `${j.user?.first_name ?? 'Someone'} joined ${j.event?.title ?? 'an event'}`,
  }));
  const reviewActivity: BusinessDashboardActivity[] = (reviews as unknown as ReviewRow[]).map((r) => ({
    id: `rev-${r.id}`,
    type: 'review' as const,
    occurred_at: r.created_at,
    label: `${r.guest?.first_name ?? 'A guest'} left a ${r.host_rating}-star review`,
    detail: r.comment,
  }));

  const recentActivity = [...redemptionActivity, ...joinActivity, ...reviewActivity]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 10);

  return {
    locations: (locsRes.data ?? []) as BusinessLocation[],
    events,
    vouchers,
    stats: {
      activeEvents: events.filter((e) => e.status === 'active' || e.status === 'full').length,
      pastEvents: events.filter((e) => e.status === 'expired').length,
      totalParticipants: events.reduce((s, e) => s + e.participant_count, 0),
      activeVouchers: vouchers.filter((v) => v.status === 'active').length,
      totalRedemptions: vouchers.reduce((s, v) => s + (v.redemption_count ?? 0), 0),
      hostRatingAvg: reviews.length ? Math.round((hostRatingTotal / reviews.length) * 10) / 10 : null,
      hostRatingCount: reviews.length,
      eventRatingAvg: reviews.length ? Math.round((eventRatingTotal / reviews.length) * 10) / 10 : null,
      eventRatingCount: reviews.length,
    },
    recentActivity,
    recentHostReviews: reviews.slice(0, 5),
  };
}
