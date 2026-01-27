// Event Recommendation Service
// Applies scoring algorithm and fallback cascade

import { calculateDistance } from '../../lib/utils';
import { calculateTotalScore, hasInterestMatch } from '../../lib/algorithm';
import { fetchDemoEvents } from './eventService';
import { toScoredEvent, type ScoredEvent } from './transformers';
import type { DemoEvent } from '../../data/demoEvents';
import type { Coordinates, Profile } from '../../types';

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
// MAIN RECOMMENDATION FUNCTION
// ===========================================

/**
 * Get recommended events with fallback cascade
 * Never returns empty - always shows something
 */
export function getRecommendations(options: RecommendationOptions): RecommendationResult {
  const {
    userProfile,
    userLocation,
    engagementByCategory,
    filterCategories = [],
    filterTimeRange = null,
    filterSearch = '',
    maxDistance,
  } = options;

  // Fetch all active events
  const allEvents = fetchDemoEvents({ status: ['active'] });

  // Apply audience filter based on user's women-only mode
  const audienceFiltered = filterByAudience(allEvents, userProfile);

  // Score all events
  const scored = scoreEvents(
    audienceFiltered,
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

// ===========================================
// SCORING
// ===========================================

/**
 * Score all events based on user preferences
 */
function scoreEvents(
  events: DemoEvent[],
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

    // Get engagement count for this category
    const categoryEventCount = engagementByCategory[event.category_value] || 0;

    // Calculate scores
    const { total, breakdown } = calculateTotalScore({
      userTags: userProfile.tags,
      eventCategory: event.category_value,
      distanceKm: distance_km,
      userRadius: userProfile.settings_radius,
      startTime: event.start_time,
      categoryEventCount,
    });

    return toScoredEvent(event, total, breakdown, distance_km);
  });
}

// ===========================================
// FILTERING
// ===========================================

/**
 * Filter events by audience restrictions
 */
function filterByAudience(events: DemoEvent[], userProfile: Profile): DemoEvent[] {
  // If user has women-only mode, show only women-only and everyone events
  if (userProfile.is_women_only_mode) {
    return events.filter((e) => e.audience === 'everyone' || e.audience === 'women');
  }

  // Filter based on user's gender
  if (userProfile.gender === 'woman') {
    return events.filter((e) => e.audience === 'everyone' || e.audience === 'women');
  }
  if (userProfile.gender === 'man') {
    return events.filter((e) => e.audience === 'everyone' || e.audience === 'men');
  }

  // Non-binary or unspecified: show "everyone" events only
  return events.filter((e) => e.audience === 'everyone');
}

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
