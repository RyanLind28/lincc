// Singleton "do you have unread chat messages?" boolean used by the bottom
// nav and side nav to render a small red dot on the Chats item.
//
// Why client-side and not a DB-backed read-state? Lincc currently has no
// per-user `last_read_at` columns on messages / direct_messages. Adding them
// is a bigger change. This hook gets us 95% of the UX for ~30 lines: a
// single localStorage timestamp marks when the user last opened the Chats
// surface; anything newer (and not sent by them) lights the dot. Realtime
// subscriptions keep it live without a refresh.

import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/utils';

const LAST_SEEN_KEY = 'lincc:chats-last-seen-at';

function readLastSeenIso(): string {
  try {
    const v = localStorage.getItem(LAST_SEEN_KEY);
    if (v) return v;
  } catch { /* ignore */ }
  // Default to a long-ago date so the very first session doesn't flood with
  // historical messages.
  return new Date(0).toISOString();
}

function writeLastSeen(ts: number) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, new Date(ts).toISOString());
  } catch { /* quota / private mode — fine */ }
}

let hasUnread = false;
let initialized = false;
let currentUserId: string | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
const subscribers = new Set<() => void>();

function notify() { for (const s of subscribers) s(); }
function getSnapshot() { return hasUnread; }
function setHasUnreadState(v: boolean) {
  if (hasUnread !== v) {
    hasUnread = v;
    notify();
  }
}

async function refresh() {
  if (!currentUserId) {
    setHasUnreadState(false);
    return;
  }
  const lastSeen = readLastSeenIso();
  try {
    // HEAD count queries — cheap. RLS restricts these tables to chats the
    // user can see, so we don't need to join to participants/conversations
    // ourselves. We exclude the user's own sends so they don't see a dot
    // because they just typed something.
    const [eventRes, dmRes] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', lastSeen)
        .neq('sender_id', currentUserId),
      supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', lastSeen)
        .neq('sender_id', currentUserId),
    ]);
    const unread = ((eventRes.count ?? 0) > 0) || ((dmRes.count ?? 0) > 0);
    setHasUnreadState(unread);
  } catch (err) {
    logger.warn('useUnreadChats refresh failed:', err);
  }
}

function attachRealtime(userId: string) {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel(`unread-chats:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const sender = (payload.new as { sender_id?: string }).sender_id;
        if (sender && sender !== userId) setHasUnreadState(true);
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        const sender = (payload.new as { sender_id?: string }).sender_id;
        if (sender && sender !== userId) setHasUnreadState(true);
      },
    )
    .subscribe();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

/**
 * Call this when the user has caught up on their chats — typically on
 * mount of the chats list or a specific chat room. Clears the dot and
 * stamps localStorage so subsequent refreshes don't re-light it for old
 * messages.
 */
export function markChatsSeen() {
  writeLastSeen(Date.now());
  setHasUnreadState(false);
}

export function useUnreadChats() {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      currentUserId = user.id;
      attachRealtime(user.id);
      refresh();
    });

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return value;
}
