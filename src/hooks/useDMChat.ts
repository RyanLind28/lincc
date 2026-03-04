// Hooks for DM chat with real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDirectMessages,
  sendDirectMessage,
  subscribeToDMs,
} from '../services/chat/dmService';
import {
  getUserConversations,
} from '../services/chat/dmService';
import { supabase } from '../lib/supabase';
import type {
  DirectMessageWithSender,
  ConversationWithDetails,
  Profile,
  DMMessageType,
} from '../types';

interface UseDMChatResult {
  messages: DirectMessageWithSender[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (
    content: string,
    messageType?: DMMessageType,
    metadata?: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useDMChat(conversationId: string | undefined): UseDMChatResult {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DirectMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDirectMessages(conversationId);
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching DM data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user?.id]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchMessages();

    if (conversationId && user?.id) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = subscribeToDMs(conversationId, async (newMessage) => {
        // Only fetch full message for messages from other users
        if (newMessage.sender_id !== user.id) {
          const { data: fullMessage } = await supabase
            .from('direct_messages')
            .select(`
              *,
              sender:profiles!sender_id(*)
            `)
            .eq('id', newMessage.id)
            .single();

          if (fullMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === fullMessage.id)) return prev;
              return [...prev, fullMessage as DirectMessageWithSender];
            });
          }
        }
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [conversationId, user?.id, fetchMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: DMMessageType = 'text',
      metadata: Record<string, unknown> = {}
    ) => {
      if (!conversationId || !user?.id || !profile) {
        return { success: false, error: 'Not authenticated' };
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return { success: false, error: 'Message cannot be empty' };
      }

      setIsSending(true);
      setError(null);

      try {
        const result = await sendDirectMessage(
          conversationId,
          user.id,
          trimmedContent,
          messageType,
          metadata
        );

        if (result.success && result.data) {
          const newMessage: DirectMessageWithSender = {
            ...result.data,
            sender: profile as Profile,
          };
          setMessages((prev) => [...prev, newMessage]);
        } else {
          setError(result.error || 'Failed to send message');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, user?.id, profile]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    refresh: fetchMessages,
  };
}

/**
 * Hook to get user's DM conversations
 */
export function useUserDMs() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching DM conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refresh: fetchConversations,
  };
}
