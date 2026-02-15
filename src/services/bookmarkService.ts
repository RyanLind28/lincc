// Bookmark (saved events) service

import { supabase } from '../lib/supabase';
import type { EventWithDetails } from '../types';

export interface BookmarkResult {
  success: boolean;
  error?: string;
}

/**
 * Save (bookmark) an event
 */
export async function saveEvent(userId: string, eventId: string): Promise<BookmarkResult> {
  const { error } = await supabase
    .from('saved_events')
    .insert({ user_id: userId, event_id: eventId });

  if (error) {
    if (error.code === '23505') {
      // Already saved (unique constraint)
      return { success: true };
    }
    console.error('Error saving event:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unsave (remove bookmark) an event
 */
export async function unsaveEvent(userId: string, eventId: string): Promise<BookmarkResult> {
  const { error } = await supabase
    .from('saved_events')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error unsaving event:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if user has saved a specific event
 */
export async function isEventSaved(userId: string, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('saved_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/**
 * Get all saved event IDs for a user
 */
export async function getSavedEventIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_events')
    .select('event_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching saved event IDs:', error);
    return [];
  }

  return (data || []).map((d) => d.event_id);
}

/**
 * Get all saved events with full details for a user
 */
export async function getSavedEvents(userId: string): Promise<EventWithDetails[]> {
  const { data, error } = await supabase
    .from('saved_events')
    .select(`
      event_id,
      events:event_id (
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*),
        participant_count:event_participants(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved events:', error);
    return [];
  }

  return (data || [])
    .map((d) => {
      const event = d.events as unknown as EventWithDetails & { participant_count: { count: number }[] };
      if (!event) return null;
      return {
        ...event,
        participant_count: event.participant_count?.[0]?.count || 0,
      } as EventWithDetails;
    })
    .filter(Boolean) as EventWithDetails[];
}
