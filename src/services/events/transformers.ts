// Event data transformers
// Converts between different event formats

import type { DemoEvent } from '../../data/demoEvents';
import type { GridEventData } from '../../components/ui/EventCardGrid';
import type { ScoreBreakdown } from '../../lib/algorithm';

/**
 * Extended event type with scoring information
 */
export interface ScoredEvent {
  id: string;
  title: string;
  category_value: string;
  category: {
    name: string;
    icon: string;
    image?: string;
  };
  subcategory?: string;
  host: {
    first_name: string;
    avatar_url: string | null;
  };
  venue_name: string;
  venue_short: string;
  venue_lat: number;
  venue_lng: number;
  start_time: string;
  capacity: number;
  participant_count: number;
  audience: 'everyone' | 'women' | 'men';
  status: string;
  // Scoring additions
  score: number;
  scoreBreakdown: ScoreBreakdown;
  distance_km: number;
}

/**
 * Transform a DemoEvent to ScoredEvent (adds scoring fields)
 */
export function toScoredEvent(
  event: DemoEvent,
  score: number,
  scoreBreakdown: ScoreBreakdown,
  distance_km: number
): ScoredEvent {
  return {
    id: event.id,
    title: event.title,
    category_value: event.category_value,
    category: event.category,
    subcategory: event.subcategory,
    host: event.host,
    venue_name: event.venue_name,
    venue_short: event.venue_short,
    venue_lat: event.venue_lat,
    venue_lng: event.venue_lng,
    start_time: event.start_time,
    capacity: event.capacity,
    participant_count: event.participant_count,
    audience: event.audience,
    status: event.status,
    score,
    scoreBreakdown,
    distance_km,
  };
}

/**
 * Transform a ScoredEvent to GridEventData for rendering
 */
export function toGridEventData(event: ScoredEvent): GridEventData {
  return {
    id: event.id,
    title: event.title,
    category: {
      name: event.category.name,
      icon: event.category.icon,
      image: event.category.image,
    },
    subcategory: event.subcategory,
    host: {
      first_name: event.host.first_name,
      avatar_url: event.host.avatar_url,
    },
    venue_name: event.venue_name,
    venue_short: event.venue_short,
    distance_km: event.distance_km,
    start_time: event.start_time,
    capacity: event.capacity,
    participant_count: event.participant_count,
  };
}

/**
 * Transform an array of ScoredEvents to GridEventData
 */
export function toGridEventDataArray(events: ScoredEvent[]): GridEventData[] {
  return events.map(toGridEventData);
}
