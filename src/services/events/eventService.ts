// Event fetching service
// Handles both demo mode and production (Supabase) events

import { supabase } from '../../lib/supabase';
import { cached, invalidatePrefix } from '../../lib/cache';
import { DEMO_EVENTS, refreshDemoEventTimes, type DemoEvent } from '../../data/demoEvents';
import type { EventWithDetails, Audience, Event } from '../../types';

// DEV_MODE flag - matches AuthContext
const DEV_MODE = false;

export interface FetchEventsOptions {
  status?: string[];
  audience?: Audience | null;
  limit?: number;
}

/**
 * Fetch events based on mode (demo or production)
 */
export async function fetchEvents(
  options: FetchEventsOptions = {}
): Promise<DemoEvent[] | EventWithDetails[]> {
  if (DEV_MODE) {
    return fetchDemoEvents(options);
  }
  return fetchProductionEvents(options);
}

/**
 * Fetch and filter demo events for development
 */
export function fetchDemoEvents(options: FetchEventsOptions = {}): DemoEvent[] {
  let events = refreshDemoEventTimes(DEMO_EVENTS);

  // Filter by status (default to active)
  const statuses = options.status || ['active'];
  events = events.filter((e) => statuses.includes(e.status));

  // Filter by audience if specified
  if (options.audience) {
    events = events.filter(
      (e) => e.audience === 'everyone' || e.audience === options.audience
    );
  }

  // Apply limit
  if (options.limit) {
    events = events.slice(0, options.limit);
  }

  return events;
}

/**
 * Fetch events from Supabase for production (cached for 30s)
 */
export async function fetchProductionEvents(
  options: FetchEventsOptions = {}
): Promise<EventWithDetails[]> {
  const cacheKey = `events:${JSON.stringify(options)}`;

  return cached(cacheKey, async () => {
    const statuses = options.status || ['active'];

    let query = supabase
      .from('events')
      .select(`
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*),
        participant_count:event_participants(count)
      `)
      .in('status', statuses)
      .gte('expires_at', new Date().toISOString())
      .order('start_time', { ascending: true });

    // Filter by audience
    // Women see: 'everyone' + 'women' events
    // Men see: 'everyone' only (never women-only events)
    if (options.audience === 'women') {
      query = query.in('audience', ['everyone', 'women']);
    } else if (options.audience === 'men') {
      query = query.eq('audience', 'everyone');
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    // Transform the count format
    return (data || []).map((event) => ({
      ...event,
      participant_count: event.participant_count?.[0]?.count || 0,
    }));
  }, 30_000); // 30 second cache
}

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
  return DEV_MODE;
}

export interface CreateEventResult {
  success: boolean;
  error?: string;
  data?: Event;
}

export interface CreateEventData {
  category_name: string; // Category name to look up
  title: string;
  description?: string;
  custom_category?: string;
  venue_name: string;
  venue_address: string;
  venue_lat?: number;
  venue_lng?: number;
  venue_place_id?: string;
  start_time: string;
  capacity: number;
  join_mode: 'request' | 'auto';
  audience: Audience;
}

/**
 * Create a new event
 */
export async function createEvent(
  eventData: CreateEventData,
  hostId: string
): Promise<CreateEventResult> {
  try {
    // Look up category by name
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', eventData.category_name)
      .single();

    if (categoryError || !categoryData) {
      // Try to find by partial match
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      // Find closest match
      const lowerName = eventData.category_name.toLowerCase();
      const matchedCategory = categoriesData?.find(
        (c) => c.name.toLowerCase().includes(lowerName) || lowerName.includes(c.name.toLowerCase())
      );

      if (!matchedCategory) {
        console.error('Category not found:', eventData.category_name);
        return { success: false, error: 'Category not found. Please try again.' };
      }

      eventData.category_name = matchedCategory.id;
    } else {
      eventData.category_name = categoryData.id;
    }

    // Calculate expires_at (24 hours after start_time)
    const startTime = new Date(eventData.start_time);
    const expiresAt = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    // Create the event
    const { data, error } = await supabase
      .from('events')
      .insert({
        host_id: hostId,
        category_id: eventData.category_name, // Now contains the ID
        title: eventData.title,
        description: eventData.description || null,
        custom_category: eventData.custom_category || null,
        venue_name: eventData.venue_name,
        venue_address: eventData.venue_address,
        venue_lat: eventData.venue_lat || 0,
        venue_lng: eventData.venue_lng || 0,
        venue_place_id: eventData.venue_place_id || null,
        start_time: eventData.start_time,
        capacity: eventData.capacity,
        join_mode: eventData.join_mode,
        audience: eventData.audience,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }

    invalidatePrefix('events:');
    return { success: true, data: data as Event };
  } catch (err) {
    console.error('Error creating event:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create event',
    };
  }
}

export interface UpdateEventData {
  title?: string;
  description?: string | null;
  venue_name?: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  start_time?: string;
  capacity?: number;
  join_mode?: 'request' | 'auto';
  audience?: Audience;
  status?: 'active' | 'cancelled' | 'full';
}

/**
 * Update an existing event (host only — RLS enforced)
 */
export async function updateEvent(
  eventId: string,
  updates: UpdateEventData
): Promise<CreateEventResult> {
  try {
    // Recalculate expires_at if start_time changed
    const patchData: Record<string, unknown> = { ...updates };
    if (updates.start_time) {
      const startTime = new Date(updates.start_time);
      patchData.expires_at = new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await supabase
      .from('events')
      .update(patchData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }

    invalidatePrefix('events:');
    return { success: true, data: data as Event };
  } catch (err) {
    console.error('Error updating event:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update event',
    };
  }
}

/**
 * Delete (cancel) an event — sets status to 'cancelled'
 */
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: error.message };
  }

  invalidatePrefix('events:');
  return { success: true };
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<EventWithDetails | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!host_id(*),
      category:categories!category_id(*),
      participant_count:event_participants(count)
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return {
    ...data,
    participant_count: data.participant_count?.[0]?.count || 0,
  } as EventWithDetails;
}
