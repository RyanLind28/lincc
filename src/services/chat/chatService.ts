import { logger } from '../../lib/utils';
// Chat service for event messaging

import { supabase } from '../../lib/supabase';
import type { Message, MessageWithSender, EventWithDetails } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface SendMessageResult {
  success: boolean;
  error?: string;
  data?: Message;
}

export interface MessagesResult {
  success: boolean;
  error?: string;
  data?: MessageWithSender[];
}

/**
 * Send a message to an event chat
 */
export async function sendMessage(
  eventId: string,
  senderId: string,
  content: string
): Promise<SendMessageResult> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { success: false, error: 'Message cannot be empty' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      event_id: eventId,
      sender_id: senderId,
      content: trimmedContent,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending message:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get all messages for an event with sender profiles
 */
export async function getMessages(eventId: string): Promise<MessagesResult> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*, business:businesses!businesses_owner_id_fkey(id, name, logo_url))
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as MessageWithSender[] };
}

/**
 * Subscribe to new messages for an event
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToMessages(
  eventId: string,
  onNewMessage: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        if (payload.new && 'id' in payload.new) {
          onNewMessage(payload.new as Message);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get events where user can chat (approved participant or host)
 *
 * PRD: "Chat archived 24h after event end." An event ends at expires_at
 * (= start_time + 2h), so we keep chats visible until 24h past expires_at
 * and filter out anything older.
 */
export async function getUserChats(userId: string): Promise<EventWithDetails[]> {
  const chatCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get event IDs where user is an approved participant
  const { data: participantRows, error: participantError } = await supabase
    .from('event_participants')
    .select('event_id')
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (participantError) {
    logger.error('Error fetching participant events:', participantError);
  }

  const participantEventIds = (participantRows || []).map((r) => r.event_id);

  // Get events where user is host OR an approved participant, within chat window
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!host_id(*),
      category:categories!category_id(*)
    `)
    .in('status', ['active', 'full'])
    .gte('expires_at', chatCutoff)
    .or(`host_id.eq.${userId}${participantEventIds.length > 0 ? `,id.in.(${participantEventIds.join(',')})` : ''}`);

  if (eventsError) {
    logger.error('Error fetching chat events:', eventsError);
  }

  // Dedupe and transform
  const eventMap = new Map<string, EventWithDetails>();
  if (events) {
    for (const event of events) {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, event as unknown as EventWithDetails);
      }
    }
  }

  // Sort by start_time (most recent first for active chats)
  return Array.from(eventMap.values()).sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
}

/**
 * Get the last message for an event (for chat preview)
 */
export async function getLastMessage(eventId: string): Promise<MessageWithSender | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching last message:', error);
    return null;
  }

  return data as MessageWithSender | null;
}

/**
 * Check if user has access to chat (is approved participant or host)
 */
export async function checkChatAccess(eventId: string, userId: string): Promise<boolean> {
  // Check if user is host
  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  if (event?.host_id === userId) {
    return true;
  }

  // Check if user is approved participant
  const { data: participant } = await supabase
    .from('event_participants')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  return participant?.status === 'approved';
}
