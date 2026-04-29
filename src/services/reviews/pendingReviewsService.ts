import { supabase } from '../../lib/supabase';

export interface PendingHostReview {
  kind: 'host';
  event: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_time: string;
    venue_name: string | null;
    host: { id: string; first_name: string; avatar_url: string | null };
  };
}

export interface PendingGuestReview {
  kind: 'guest';
  event: {
    id: string;
    title: string;
    cover_image_url: string | null;
    start_time: string;
    venue_name: string | null;
  };
  guest: { id: string; first_name: string; avatar_url: string | null };
}

export type PendingReview = PendingHostReview | PendingGuestReview;

export async function fetchPendingHostReviews(userId: string): Promise<PendingHostReview[]> {
  // Events the user attended (approved), expired, that they haven't reviewed yet
  const { data: participations } = await supabase
    .from('event_participants')
    .select(`
      event:events!event_participants_event_id_fkey(
        id, title, cover_image_url, start_time, venue_name, status, host_id,
        host:profiles!host_id(id, first_name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'approved');

  const candidates = (participations ?? [])
    .map((p) => (p as { event: unknown }).event)
    .filter((e): e is {
      id: string; title: string; cover_image_url: string | null; start_time: string;
      venue_name: string | null; status: string; host_id: string;
      host: { id: string; first_name: string; avatar_url: string | null };
    } => !!e && (e as { status: string }).status === 'expired');

  if (candidates.length === 0) return [];

  const { data: existing } = await supabase
    .from('host_reviews')
    .select('event_id')
    .eq('guest_id', userId)
    .in('event_id', candidates.map((c) => c.id));
  const reviewed = new Set((existing ?? []).map((r) => r.event_id));

  return candidates
    .filter((e) => !reviewed.has(e.id))
    .map((e) => ({
      kind: 'host' as const,
      event: {
        id: e.id,
        title: e.title,
        cover_image_url: e.cover_image_url,
        start_time: e.start_time,
        venue_name: e.venue_name,
        host: e.host,
      },
    }));
}

export async function fetchPendingGuestReviews(userId: string): Promise<PendingGuestReview[]> {
  // Events the user hosted, expired
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('id, title, cover_image_url, start_time, venue_name')
    .eq('host_id', userId)
    .eq('status', 'expired');

  if (!hostedEvents || hostedEvents.length === 0) return [];

  const eventIds = hostedEvents.map((e) => e.id);

  // For each event, find approved participants the host hasn't reviewed yet
  const { data: participants } = await supabase
    .from('event_participants')
    .select(`
      event_id, user_id,
      guest:profiles!event_participants_user_id_fkey(id, first_name, avatar_url)
    `)
    .in('event_id', eventIds)
    .eq('status', 'approved')
    .neq('user_id', userId);

  const { data: alreadyReviewed } = await supabase
    .from('guest_reviews')
    .select('event_id, guest_id')
    .eq('host_id', userId)
    .in('event_id', eventIds);
  const reviewedKey = new Set(
    (alreadyReviewed ?? []).map((r) => `${r.event_id}:${r.guest_id}`),
  );

  const eventsById = new Map(hostedEvents.map((e) => [e.id, e]));
  const result: PendingGuestReview[] = [];

  for (const p of participants ?? []) {
    const key = `${p.event_id}:${p.user_id}`;
    if (reviewedKey.has(key)) continue;
    const event = eventsById.get(p.event_id);
    if (!event) continue;
    const guest = (p as unknown as { guest: { id: string; first_name: string; avatar_url: string | null } | null }).guest;
    if (!guest) continue;
    result.push({
      kind: 'guest',
      event: {
        id: event.id,
        title: event.title,
        cover_image_url: event.cover_image_url,
        start_time: event.start_time,
        venue_name: event.venue_name,
      },
      guest,
    });
  }

  return result;
}

export async function fetchPendingReviews(userId: string): Promise<PendingReview[]> {
  const [hostReviews, guestReviews] = await Promise.all([
    fetchPendingHostReviews(userId),
    fetchPendingGuestReviews(userId),
  ]);
  return [...hostReviews, ...guestReviews];
}

// Local dismissal storage — sessionStorage = "later" (next session retry),
// localStorage = "don't ask again" per (eventId, kind, optional guestId).

const PERMANENT_KEY_PREFIX = 'lincc:review-dismissed:';
const SESSION_KEY_PREFIX = 'lincc:review-session-skip:';

function permanentKey(eventId: string, kind: 'host' | 'guest', guestId?: string) {
  return guestId
    ? `${PERMANENT_KEY_PREFIX}${kind}:${eventId}:${guestId}`
    : `${PERMANENT_KEY_PREFIX}${kind}:${eventId}`;
}

function sessionKey(eventId: string, kind: 'host' | 'guest', guestId?: string) {
  return guestId
    ? `${SESSION_KEY_PREFIX}${kind}:${eventId}:${guestId}`
    : `${SESSION_KEY_PREFIX}${kind}:${eventId}`;
}

export function isReviewDismissed(item: PendingReview): boolean {
  const guestId = item.kind === 'guest' ? item.guest.id : undefined;
  return (
    !!localStorage.getItem(permanentKey(item.event.id, item.kind, guestId)) ||
    !!sessionStorage.getItem(sessionKey(item.event.id, item.kind, guestId))
  );
}

export function dismissReviewForSession(item: PendingReview) {
  const guestId = item.kind === 'guest' ? item.guest.id : undefined;
  sessionStorage.setItem(sessionKey(item.event.id, item.kind, guestId), '1');
}

export function dismissReviewPermanently(item: PendingReview) {
  const guestId = item.kind === 'guest' ? item.guest.id : undefined;
  localStorage.setItem(permanentKey(item.event.id, item.kind, guestId), '1');
}
