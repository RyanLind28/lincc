// Event Recommendation Service
// Applies scoring algorithm and fallback cascade

import { supabase } from '../../lib/supabase';
import { calculateDistance } from '../../lib/utils';
import { calculateTotalScore, hasInterestMatch } from '../../lib/algorithm';
import type { ScoredEvent } from './transformers';
import type { Coordinates, Profile, EventWithDetails } from '../../types';

// ===========================================
// TYPES
// ===========================================

export type FallbackType = 'none' | 'distance' | 'any';

export interface RecommendationResult {
  events: ScoredEvent[];
  fallbackUsed: FallbackType;
  totalAvailable: number;
}

export interface RecommendationOptions {
  userProfile: Profile;
  userLocation: Coordinates | null;
  engagementByCategory: Record<string, number>;
  filterCategories?: string[];
  filterTimeRange?: string | null;
  filterSearch?: string;
  maxDistance?: number;
}

// ===========================================
// FETCH EVENTS FROM SUPABASE
// ===========================================

/**
 * Fetch active events from Supabase
 */
export async function fetchActiveEvents(audience?: string): Promise<EventWithDetails[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      host:profiles!host_id(*),
      category:categories!category_id(*),
      participant_count:event_participants(count)
    `)
    .eq('status', 'active')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  // Filter by audience
  // Women see: 'everyone' + 'women' events
  // Men see: 'everyone' only (never women-only events)
  if (audience === 'women') {
    query = query.in('audience', ['everyone', 'women']);
  } else if (audience === 'men') {
    query = query.eq('audience', 'everyone');
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
  })) as EventWithDetails[];
}

// ===========================================
// MAIN RECOMMENDATION FUNCTION (ASYNC)
// ===========================================

/**
 * Get recommended events with fallback cascade
 * Never returns empty - always shows something
 */
export async function getRecommendationsAsync(
  options: RecommendationOptions
): Promise<RecommendationResult> {
  const {
    userProfile,
    userLocation,
    engagementByCategory,
    filterCategories = [],
    filterTimeRange = null,
    filterSearch = '',
    maxDistance,
  } = options;

  // Determine audience filter based on user profile
  // Women can see: 'everyone' + 'women' events
  // Men can see: 'everyone' events only (never women-only)
  let audienceFilter: 'women' | 'men' | undefined;
  if (userProfile.gender === 'woman') {
    audienceFilter = 'women';
  } else if (userProfile.gender === 'man') {
    audienceFilter = 'men';
  }
  // Note: 'men' filter shows only 'everyone' events (no women-only)

  // Fetch active events from Supabase
  const allEvents = await fetchActiveEvents(audienceFilter);

  // Score all events
  const scored = scoreEvents(
    allEvents,
    userProfile,
    userLocation,
    engagementByCategory
  );

  // Apply user filters (categories, time, search)
  const filtered = applyFilters(scored, {
    categories: filterCategories,
    timeRange: filterTimeRange,
    search: filterSearch,
    maxDistance: maxDistance ?? userProfile.settings_radius,
    userLocation,
  });

  // Apply fallback cascade
  return applyFallbackCascade(filtered, scored);
}

/**
 * Synchronous version for backwards compatibility (uses cached/empty data)
 * @deprecated Use getRecommendationsAsync instead
 */
export function getRecommendations(_options: RecommendationOptions): RecommendationResult {
  // Return empty result - actual data comes from async version
  return {
    events: [],
    fallbackUsed: 'any',
    totalAvailable: 0,
  };
}

// ===========================================
// SCORING
// ===========================================

/**
 * Score all events based on user preferences
 */
function scoreEvents(
  events: EventWithDetails[],
  userProfile: Profile,
  userLocation: Coordinates | null,
  engagementByCategory: Record<string, number>
): ScoredEvent[] {
  // Default location (Central London) if no user location
  const location = userLocation || { latitude: 51.5074, longitude: -0.1278 };

  return events.map((event) => {
    // Calculate distance
    const distance_km = calculateDistance(
      location.latitude,
      location.longitude,
      event.venue_lat,
      event.venue_lng
    );

    // Get category value from the category object (cast to access value property from DB)
    const categoryObj = event.category as { name?: string; icon?: string; value?: string } | null;
    const categoryValue = categoryObj?.value || categoryObj?.name?.toLowerCase() || '';

    // Get engagement count for this category
    const categoryEventCount = engagementByCategory[categoryValue] || 0;

    // Calculate scores
    const { total, breakdown } = calculateTotalScore({
      userTags: userProfile.tags,
      eventCategory: categoryValue,
      distanceKm: distance_km,
      userRadius: userProfile.settings_radius,
      startTime: event.start_time,
      categoryEventCount,
    });

    // Transform to ScoredEvent format
    return {
      id: event.id,
      title: event.title,
      category: {
        name: categoryObj?.name || 'Event',
        icon: categoryObj?.icon || 'Calendar',
      },
      category_value: categoryValue,
      subcategory: undefined,
      venue_name: event.venue_name,
      venue_short: event.venue_address?.split(',')[0] || event.venue_name,
      venue_lat: event.venue_lat,
      venue_lng: event.venue_lng,
      start_time: event.start_time,
      capacity: event.capacity,
      participant_count: event.participant_count || 0,
      host: {
        first_name: event.host?.first_name || 'Host',
        avatar_url: event.host?.avatar_url || null,
      },
      audience: event.audience,
      status: event.status,
      score: total,
      scoreBreakdown: breakdown,
      distance_km,
    };
  });
}

// ===========================================
// FILTERING
// ===========================================

interface FilterOptions {
  categories: string[];
  timeRange: string | null;
  search: string;
  maxDistance: number;
  userLocation: Coordinates | null;
}

/**
 * Apply user-selected filters
 */
function applyFilters(events: ScoredEvent[], options: FilterOptions): ScoredEvent[] {
  let filtered = [...events];

  // Category filter
  if (options.categories.length > 0) {
    filtered = filtered.filter((e) => options.categories.includes(e.category_value));
  }

  // Distance filter
  if (options.userLocation) {
    filtered = filtered.filter((e) => e.distance_km <= options.maxDistance);
  }

  // Time range filter
  if (options.timeRange) {
    const now = new Date();
    filtered = filtered.filter((e) => {
      const startTime = new Date(e.start_time);
      const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      switch (options.timeRange) {
        case 'now':
          // Starting within 30 minutes
          return hoursUntil >= 0 && hoursUntil <= 0.5;
        case '1hr':
          return hoursUntil >= 0 && hoursUntil <= 1;
        case 'today': {
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          return startTime >= now && startTime <= endOfDay;
        }
        default:
          return true;
      }
    });
  }

  // Search filter
  if (options.search.trim()) {
    const searchLower = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.venue_name.toLowerCase().includes(searchLower) ||
        e.venue_short.toLowerCase().includes(searchLower) ||
        e.category.name.toLowerCase().includes(searchLower) ||
        (e.subcategory && e.subcategory.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
}

// ===========================================
// FALLBACK CASCADE
// ===========================================

/**
 * Apply fallback cascade to ensure we never return empty
 *
 * Cascade order:
 * 1. Interest-matched events (score >= threshold)
 * 2. Distance-based events (within radius)
 * 3. Any active events (sorted by time)
 */
function applyFallbackCascade(
  filtered: ScoredEvent[],
  allScored: ScoredEvent[]
): RecommendationResult {
  // Sort filtered by score (highest first)
  const sortedFiltered = [...filtered].sort((a, b) => b.score - a.score);

  // Check for interest-matched events
  const interestMatched = sortedFiltered.filter((e) =>
    hasInterestMatch(e.scoreBreakdown.interest)
  );

  if (interestMatched.length > 0) {
    return {
      events: sortedFiltered, // Return all filtered, sorted by score
      fallbackUsed: 'none',
      totalAvailable: allScored.length,
    };
  }

  // Fallback 1: Any events within distance (from filtered)
  if (sortedFiltered.length > 0) {
    return {
      events: sortedFiltered,
      fallbackUsed: 'distance',
      totalAvailable: allScored.length,
    };
  }

  // Fallback 2: Any active events (sorted by time, closest first)
  const sortedByTime = [...allScored].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });

  return {
    events: sortedByTime,
    fallbackUsed: 'any',
    totalAvailable: allScored.length,
  };
}

// ===========================================
// UTILITIES
// ===========================================

/**
 * Get a human-readable fallback message
 */
export function getFallbackMessage(fallbackType: FallbackType): string | null {
  switch (fallbackType) {
    case 'distance':
      return 'Showing events nearby';
    case 'any':
      return 'Showing all available events';
    default:
      return null;
  }
}
