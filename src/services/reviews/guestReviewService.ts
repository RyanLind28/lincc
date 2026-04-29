import { supabase } from '../../lib/supabase';

export interface GuestReview {
  id: string;
  event_id: string;
  host_id: string;
  guest_id: string;
  guest_rating: number;
  comment: string | null;
  created_at: string;
  guest_reply: string | null;
  guest_replied_at: string | null;
  is_disputed: boolean;
  disputed_at: string | null;
  disputed_by: string | null;
  dispute_reason: string | null;
  guest?: { first_name: string; avatar_url: string | null } | null;
}

export async function getGuestReviewsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from('guest_reviews')
    .select(`
      id, event_id, host_id, guest_id, guest_rating, comment, created_at,
      guest_reply, guest_replied_at,
      is_disputed, disputed_at, disputed_by, dispute_reason,
      guest:profiles!guest_reviews_guest_id_fkey(first_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  return { data: (data ?? []) as unknown as GuestReview[], error };
}

export async function submitGuestReview(
  eventId: string,
  hostId: string,
  guestId: string,
  guestRating: number,
  comment: string,
) {
  const { error } = await supabase
    .from('guest_reviews')
    .insert({
      event_id: eventId,
      host_id: hostId,
      guest_id: guestId,
      guest_rating: guestRating,
      comment: comment.trim() || null,
    });
  if (error?.code === '23505') {
    return { success: false, error: 'You already reviewed this guest' };
  }
  return { success: !error, error: error?.message };
}

export async function getReviewedGuestIds(eventId: string, hostId: string) {
  const { data } = await supabase
    .from('guest_reviews')
    .select('guest_id')
    .eq('event_id', eventId)
    .eq('host_id', hostId);
  return new Set((data ?? []).map((r) => r.guest_id));
}

export async function submitGuestReply(reviewId: string, reply: string) {
  const trimmed = reply.trim();
  if (!trimmed) return { success: false, error: 'Reply cannot be empty' };
  const { error } = await supabase
    .from('guest_reviews')
    .update({ guest_reply: trimmed, guest_replied_at: new Date().toISOString() })
    .eq('id', reviewId);
  return { success: !error, error: error?.message };
}

export async function disputeGuestReview(reviewId: string, userId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Please describe the issue' };
  const { error } = await supabase
    .from('guest_reviews')
    .update({
      is_disputed: true,
      disputed_at: new Date().toISOString(),
      disputed_by: userId,
      dispute_reason: trimmed,
    })
    .eq('id', reviewId);
  return { success: !error, error: error?.message };
}

export async function getGuestRatingSummary(guestId: string) {
  const { data } = await supabase
    .from('guest_reviews')
    .select('guest_rating')
    .eq('guest_id', guestId);
  if (!data || data.length === 0) return { average: null as number | null, count: 0 };
  const total = data.reduce((sum, r: { guest_rating: number }) => sum + r.guest_rating, 0);
  return { average: Math.round((total / data.length) * 10) / 10, count: data.length };
}
