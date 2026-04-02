import { supabase } from '../lib/supabase';

export async function getEventReviews(eventId: string) {
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, rating, comment, created_at, user_id, profiles!event_reviews_user_id_fkey(first_name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

export async function submitReview(eventId: string, userId: string, rating: number, comment: string) {
  const { error } = await supabase
    .from('event_reviews')
    .insert({ event_id: eventId, user_id: userId, rating, comment: comment.trim() || null });
  if (error?.code === '23505') {
    return { success: false, error: 'You already reviewed this event' };
  }
  return { success: !error, error: error?.message };
}

export async function hasUserReviewed(eventId: string, userId: string) {
  const { data } = await supabase
    .from('event_reviews')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getAverageRating(eventId: string) {
  const { data } = await supabase
    .from('event_reviews')
    .select('rating')
    .eq('event_id', eventId);
  if (!data || data.length === 0) return null;
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { average: Math.round(avg * 10) / 10, count: data.length };
}
