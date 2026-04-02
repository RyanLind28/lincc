import { supabase } from '../lib/supabase';

export interface TrustScore {
  score: number; // 0-100
  level: 'new' | 'rising' | 'trusted' | 'veteran';
  eventsHosted: number;
  eventsJoined: number;
  avgRating: number | null;
  reviewCount: number;
}

export async function calculateTrustScore(userId: string): Promise<TrustScore> {
  const [hosted, joined, reviews] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('host_id', userId),
    supabase.from('event_participants').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved'),
    supabase.from('event_reviews').select('rating').eq('user_id', userId),
  ]);

  const eventsHosted = hosted.count ?? 0;
  const eventsJoined = joined.count ?? 0;
  const reviewData = reviews.data ?? [];
  const reviewCount = reviewData.length;
  const avgRating = reviewCount > 0
    ? Math.round((reviewData.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  // Score calculation (0-100)
  const hostingPoints = Math.min(eventsHosted * 5, 25);        // max 25
  const joiningPoints = Math.min(eventsJoined * 3, 25);        // max 25
  const ratingPoints = avgRating ? Math.round(avgRating * 5) : 0; // max 25
  const reviewPoints = Math.min(reviewCount * 5, 25);           // max 25

  const score = Math.min(hostingPoints + joiningPoints + ratingPoints + reviewPoints, 100);

  let level: TrustScore['level'] = 'new';
  if (score >= 75) level = 'veteran';
  else if (score >= 40) level = 'trusted';
  else if (score >= 15) level = 'rising';

  return { score, level, eventsHosted, eventsJoined, avgRating, reviewCount };
}
