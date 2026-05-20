import { supabase } from '../../lib/supabase';

export interface HostReview {
  id: string;
  event_id: string;
  guest_id: string;
  host_rating: number;
  event_rating: number;
  comment: string | null;
  created_at: string;
  host_reply: string | null;
  host_replied_at: string | null;
  is_disputed: boolean;
  disputed_at: string | null;
  disputed_by: string | null;
  dispute_reason: string | null;
  guest?: { first_name: string; avatar_url: string | null } | null;
}

export async function getHostReviewsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from('host_reviews')
    .select(`
      id, event_id, guest_id, host_rating, event_rating, comment, created_at,
      host_reply, host_replied_at,
      is_disputed, disputed_at, disputed_by, dispute_reason,
      guest:profiles!host_reviews_guest_id_fkey(first_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  return { data: (data ?? []) as unknown as HostReview[], error };
}

export async function submitHostReview(
  eventId: string,
  guestId: string,
  hostRating: number,
  eventRating: number,
  comment: string,
) {
  const { error } = await supabase
    .from('host_reviews')
    .insert({
      event_id: eventId,
      guest_id: guestId,
      host_rating: hostRating,
      event_rating: eventRating,
      comment: comment.trim() || null,
    });
  if (error?.code === '23505') {
    return { success: true, alreadyExists: true };
  }
  return { success: !error, error: error?.message };
}

export async function hasGuestReviewedHost(eventId: string, guestId: string) {
  const { data } = await supabase
    .from('host_reviews')
    .select('id')
    .eq('event_id', eventId)
    .eq('guest_id', guestId)
    .maybeSingle();
  return !!data;
}

export async function submitHostReply(reviewId: string, reply: string) {
  const trimmed = reply.trim();
  if (!trimmed) return { success: false, error: 'Reply cannot be empty' };
  const { error } = await supabase
    .from('host_reviews')
    .update({ host_reply: trimmed, host_replied_at: new Date().toISOString() })
    .eq('id', reviewId);
  return { success: !error, error: error?.message };
}

export async function disputeHostReview(reviewId: string, userId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Please describe the issue' };
  const { error } = await supabase
    .from('host_reviews')
    .update({
      is_disputed: true,
      disputed_at: new Date().toISOString(),
      disputed_by: userId,
      dispute_reason: trimmed,
    })
    .eq('id', reviewId);
  return { success: !error, error: error?.message };
}

export async function getHostRatingSummary(hostId: string) {
  const { data } = await supabase
    .from('host_reviews')
    .select('host_rating, events!host_reviews_event_id_fkey!inner(host_id)')
    .eq('events.host_id', hostId);
  if (!data || data.length === 0) return { average: null as number | null, count: 0 };
  const total = data.reduce((sum, r: { host_rating: number }) => sum + r.host_rating, 0);
  return { average: Math.round((total / data.length) * 10) / 10, count: data.length };
}
