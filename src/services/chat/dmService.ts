// DM service for 1-on-1 direct messaging

import { supabase } from '../../lib/supabase';
import type {
  DirectMessage,
  DirectMessageWithSender,
  Conversation,
  ConversationWithDetails,
  DMMessageType,
  Profile,
} from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ── Get or create a conversation between two users ──────────────────
export async function getOrCreateConversation(
  userA: string,
  userB: string
): Promise<{ success: boolean; error?: string; data?: Conversation }> {
  // Canonical ordering: smaller UUID = participant_one
  const [p1, p2] = userA < userB ? [userA, userB] : [userB, userA];

  // Try to find existing conversation
  const { data: existing, error: findErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('participant_one', p1)
    .eq('participant_two', p2)
    .maybeSingle();

  if (findErr) {
    console.error('Error finding conversation:', findErr);
    return { success: false, error: findErr.message };
  }

  if (existing) {
    return { success: true, data: existing as Conversation };
  }

  // Create new conversation
  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert({ participant_one: p1, participant_two: p2 })
    .select()
    .single();

  if (createErr) {
    console.error('Error creating conversation:', createErr);
    return { success: false, error: createErr.message };
  }

  return { success: true, data: created as Conversation };
}

// ── Send a direct message ───────────────────────────────────────────
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: DMMessageType = 'text',
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string; data?: DirectMessage }> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { success: false, error: 'Message cannot be empty' };
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmedContent,
      message_type: messageType,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending DM:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DirectMessage };
}

// ── Get messages for a conversation ─────────────────────────────────
export async function getDirectMessages(
  conversationId: string
): Promise<{ success: boolean; error?: string; data?: DirectMessageWithSender[] }> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching DMs:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DirectMessageWithSender[] };
}

// ── Get all conversations for a user (with other user + last msg) ───
export async function getUserConversations(
  userId: string
): Promise<ConversationWithDetails[]> {
  // Fetch conversations where user is a participant
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error || !convos) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // For each conversation, fetch other user profile + last message
  const results = await Promise.all(
    convos.map(async (convo) => {
      const otherUserId =
        convo.participant_one === userId ? convo.participant_two : convo.participant_one;

      // Fetch other user profile
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      // Fetch last message
      const { data: lastMsg } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...convo,
        other_user: otherUser as Profile,
        last_message: (lastMsg as DirectMessage) || null,
      } as ConversationWithDetails;
    })
  );

  return results.filter((r) => r.other_user);
}

// ── Subscribe to new DMs in a conversation ──────────────────────────
export function subscribeToDMs(
  conversationId: string,
  onNewMessage: (message: DirectMessage) => void
): () => void {
  const channel = supabase
    .channel(`dm:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: RealtimePostgresChangesPayload<DirectMessage>) => {
        if (payload.new && 'id' in payload.new) {
          onNewMessage(payload.new as DirectMessage);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
