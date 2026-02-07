// Hook for event chat with real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  sendMessage as sendMessageService,
  getMessages,
  subscribeToMessages,
  checkChatAccess,
} from '../services/chat';
import { supabase } from '../lib/supabase';
import type { MessageWithSender, Profile } from '../types';

interface UseEventChatResult {
  messages: MessageWithSender[];
  isLoading: boolean;
  isSending: boolean;
  hasAccess: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useEventChat(eventId: string | undefined): UseEventChatResult {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch messages and check access
  const fetchData = useCallback(async () => {
    if (!eventId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check access first
      const canAccess = await checkChatAccess(eventId, user.id);
      setHasAccess(canAccess);

      if (!canAccess) {
        setIsLoading(false);
        return;
      }

      // Fetch messages
      const result = await getMessages(eventId);
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.id]);

  // Initial fetch and subscription setup
  useEffect(() => {
    fetchData();

    // Set up real-time subscription
    if (eventId && user?.id) {
      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = subscribeToMessages(eventId, async (newMessage) => {
        // Fetch the full message with sender profile if it's not from current user
        if (newMessage.sender_id !== user.id) {
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id(*)
            `)
            .eq('id', newMessage.id)
            .single();

          if (fullMessage) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === fullMessage.id)) {
                return prev;
              }
              return [...prev, fullMessage as MessageWithSender];
            });
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [eventId, user?.id, fetchData]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!eventId || !user?.id || !profile) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!hasAccess) {
        return { success: false, error: 'You do not have access to this chat' };
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return { success: false, error: 'Message cannot be empty' };
      }

      setIsSending(true);
      setError(null);

      try {
        const result = await sendMessageService(eventId, user.id, trimmedContent);

        if (result.success && result.data) {
          // Optimistically add the message with the current user's profile
          const newMessage: MessageWithSender = {
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
    [eventId, user?.id, profile, hasAccess]
  );

  return {
    messages,
    isLoading,
    isSending,
    hasAccess,
    error,
    sendMessage,
    refresh: fetchData,
  };
}

/**
 * Hook to get user's available chats (events where they can chat)
 */
export function useUserChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<
    Array<{
      event: import('../types').EventWithDetails;
      lastMessage: MessageWithSender | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { getUserChats, getLastMessage } = await import('../services/chat');
      const events = await getUserChats(user.id);

      // Fetch last message for each event
      const chatsWithMessages = await Promise.all(
        events.map(async (event) => {
          const lastMessage = await getLastMessage(event.id);
          return { event, lastMessage };
        })
      );

      // Sort by last message time (most recent first)
      chatsWithMessages.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || a.event.created_at;
        const timeB = b.lastMessage?.created_at || b.event.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setChats(chatsWithMessages);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    isLoading,
    error,
    refresh: fetchChats,
  };
}
