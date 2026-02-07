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
    console.error('Error sending message:', error);
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
      sender:profiles!sender_id(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
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
 */
export async function getUserChats(userId: string): Promise<EventWithDetails[]> {
  // Get events where user is an approved participant
  const { data: participantEvents, error: participantError } = await supabase
    .from('event_participants')
    .select(`
      event:events!event_id(
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*),
        participant_count:event_participants(count)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (participantError) {
    console.error('Error fetching participant events:', participantError);
  }

  // Get events where user is the host
  const { data: hostEvents, error: hostError } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!host_id(*),
      category:categories!category_id(*),
      participant_count:event_participants(count)
    `)
    .eq('host_id', userId)
    .in('status', ['active', 'full']);

  if (hostError) {
    console.error('Error fetching host events:', hostError);
  }

  // Combine and dedupe events
  const eventMap = new Map<string, EventWithDetails>();

  // Add participant events
  if (participantEvents) {
    for (const p of participantEvents) {
      const event = p.event as unknown as EventWithDetails & { participant_count: { count: number }[] };
      if (event && event.id) {
        eventMap.set(event.id, {
          ...event,
          participant_count: event.participant_count?.[0]?.count || 0,
        });
      }
    }
  }

  // Add host events
  if (hostEvents) {
    for (const event of hostEvents) {
      const transformedEvent = event as unknown as EventWithDetails & { participant_count: { count: number }[] };
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, {
          ...transformedEvent,
          participant_count: transformedEvent.participant_count?.[0]?.count || 0,
        });
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
    console.error('Error fetching last message:', error);
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
