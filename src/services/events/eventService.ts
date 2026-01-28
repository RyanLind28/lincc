// Event fetching service
// Handles both demo mode and production (Supabase) events

import { supabase } from '../../lib/supabase';
import { DEMO_EVENTS, refreshDemoEventTimes, type DemoEvent } from '../../data/demoEvents';
import type { EventWithDetails, Audience } from '../../types';

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
 * Fetch events from Supabase for production
 */
export async function fetchProductionEvents(
  options: FetchEventsOptions = {}
): Promise<EventWithDetails[]> {
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
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  // Filter by audience
  if (options.audience === 'women') {
    query = query.in('audience', ['everyone', 'women']);
  } else if (options.audience === 'men') {
    query = query.in('audience', ['everyone', 'men']);
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
}

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
  return DEV_MODE;
}
