// Notification service for user notifications

import { supabase } from '../lib/supabase';
import type { Notification, NotificationType } from '../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface NotificationsResult {
  success: boolean;
  error?: string;
  data?: Notification[];
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  data?: Notification;
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string): Promise<NotificationsResult> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Notification[] };
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<NotificationResult> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Notification };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Subscribe to new notifications for a user
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        if (payload.new && 'id' in payload.new) {
          onNewNotification(payload.new as Notification);
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
 * Create a notification (typically called from backend/triggers, but useful for testing)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<NotificationResult> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: notification as Notification };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the navigation path for a notification based on its type and data
 */
export function getNotificationPath(notification: Notification): string {
  const { type, data } = notification;
  const eventId = data?.event_id as string | undefined;

  switch (type) {
    case 'join_request':
      return eventId ? `/event/${eventId}/manage` : '/my-events';
    case 'request_approved':
    case 'request_declined':
      return eventId ? `/event/${eventId}` : '/';
    case 'new_message':
      return eventId ? `/event/${eventId}/chat` : '/chats';
    case 'event_starting':
    case 'event_cancelled':
      return eventId ? `/event/${eventId}` : '/';
    default:
      return '/';
  }
}
