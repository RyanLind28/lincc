// Event Recommendation Scoring Algorithm
// All scoring weights and formulas in one place for easy tuning

import { getAllMatchingCategories, isRelatedCategory } from '../data/tagToCategoryMap';

// ===========================================
// CONFIGURABLE WEIGHTS (0-100 total)
// ===========================================
export const SCORE_WEIGHTS = {
  interest: 35,      // Max points for interest match
  distance: 25,      // Max points for distance
  time: 20,          // Max points for time relevance
  engagement: 10,    // Max points for engagement history
  popularity: 5,     // Max points for social proof (participant ratio)
  timeOfDay: 5,      // Max points for matching user's preferred activity hours
} as const;

// Interest scoring thresholds
export const INTEREST_THRESHOLDS = {
  directMatch: 35,   // User tag matches event category exactly
  relatedMatch: 22,  // Event category is related to user's interests
} as const;

// Engagement scoring
export const ENGAGEMENT_CONFIG = {
  maxEvents: 5,           // Cap at this many past events for max score
  pointsPerEvent: 2,      // Points per past event in category
} as const;

// Time-of-day defaults (when user has no history)
const DEFAULT_PREFERRED_HOURS = [17, 18, 19, 20]; // Evenings

// ===========================================
// SCORING FUNCTIONS
// ===========================================

/**
 * Calculate interest match score based on user tags and event category
 * @param userTags - Array of user interest tags (e.g., ['coffee', 'yoga', 'hiking'])
 * @param eventCategory - The event's category value (e.g., 'wellness')
 * @returns Score from 0 to SCORE_WEIGHTS.interest
 */
export function calculateInterestScore(
  userTags: string[],
  eventCategory: string
): number {
  if (!userTags.length || !eventCategory) return 0;

  const matchingCategories = getAllMatchingCategories(userTags);

  // Direct match: user's tags map to this exact category
  if (matchingCategories.has(eventCategory)) {
    return INTEREST_THRESHOLDS.directMatch;
  }

  // Related match: check if any of user's matching categories are related
  for (const userCategory of matchingCategories) {
    if (isRelatedCategory(userCategory, eventCategory)) {
      return INTEREST_THRESHOLDS.relatedMatch;
    }
  }

  return 0;
}

/**
 * Calculate distance score using exponential decay
 * Strongly prefers very nearby events over ones at the edge of the radius
 * @param distanceKm - Distance to event in kilometers
 * @param userRadius - User's search radius setting in km
 * @returns Score from 0 to SCORE_WEIGHTS.distance
 */
export function calculateDistanceScore(
  distanceKm: number,
  userRadius: number
): number {
  if (distanceKm < 0 || userRadius <= 0) return 0;

  // Events beyond user's radius get 0
  if (distanceKm > userRadius) return 0;

  // Exponential decay: very nearby events score disproportionately higher
  // At 0km: 25pts, at 50% radius: ~9pts, at 100% radius: ~3pts
  const decay = Math.exp(-2 * distanceKm / userRadius);
  return Math.round(decay * SCORE_WEIGHTS.distance);
}

/**
 * Calculate time relevance score using continuous exponential decay
 * Events starting sooner score higher, with a floor of 2 points
 * @param startTime - Event start time (Date or ISO string)
 * @returns Score from 0 to SCORE_WEIGHTS.time
 */
export function calculateTimeScore(startTime: Date | string): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const now = new Date();

  // Past events get 0
  if (start <= now) return 0;

  const hoursAway = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Continuous exponential decay with floor of 2
  // 0h→20, 1h→17, 3h→13, 6h→8, 12h→3, 24h+→2
  return Math.round(Math.max(2, SCORE_WEIGHTS.time * Math.exp(-0.15 * hoursAway)));
}

/**
 * Calculate engagement score based on past participation
 * @param categoryEventCount - Number of past events user joined in this category
 * @returns Score from 0 to SCORE_WEIGHTS.engagement
 */
export function calculateEngagementScore(categoryEventCount: number): number {
  if (categoryEventCount <= 0) return 0;

  // Cap at maxEvents
  const cappedCount = Math.min(categoryEventCount, ENGAGEMENT_CONFIG.maxEvents);

  return Math.min(
    cappedCount * ENGAGEMENT_CONFIG.pointsPerEvent,
    SCORE_WEIGHTS.engagement
  );
}

/**
 * Calculate popularity score based on participant ratio (social proof)
 * Events with more participants relative to capacity score higher
 * @param participantCount - Current number of participants
 * @param capacity - Max event capacity
 * @returns Score from 0 to SCORE_WEIGHTS.popularity
 */
export function calculatePopularityScore(
  participantCount: number,
  capacity: number
): number {
  if (capacity <= 0 || participantCount <= 0) return 0;

  const ratio = Math.min(participantCount / capacity, 1);
  return Math.round(ratio * SCORE_WEIGHTS.popularity);
}

/**
 * Calculate time-of-day preference score
 * Events that fall in the user's typical activity window score higher
 * @param startTime - Event start time
 * @param preferredHours - Array of preferred hours (0-23), e.g. [17, 18, 19, 20]
 * @returns Score from 0 to SCORE_WEIGHTS.timeOfDay
 */
export function calculateTimeOfDayScore(
  startTime: Date | string,
  preferredHours: number[]
): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const hour = start.getHours();

  const hours = preferredHours.length > 0 ? preferredHours : DEFAULT_PREFERRED_HOURS;

  // Direct match: event starts in preferred window
  if (hours.includes(hour)) {
    return SCORE_WEIGHTS.timeOfDay; // 5 pts
  }

  // Adjacent: within 1 hour of preferred window
  const isAdjacent = hours.some((h) => Math.abs(h - hour) === 1 || Math.abs(h - hour) === 23);
  if (isAdjacent) {
    return 3; // 3 pts
  }

  // Off-hours
  return 1;
}

/**
 * Calculate total score for an event
 */
export interface ScoreBreakdown {
  interest: number;
  distance: number;
  time: number;
  engagement: number;
  popularity: number;
  timeOfDay: number;
}

export interface ScoreInput {
  userTags: string[];
  eventCategory: string;
  distanceKm: number;
  userRadius: number;
  startTime: Date | string;
  categoryEventCount: number;
  participantCount: number;
  capacity: number;
  preferredHours: number[];
}

export function calculateTotalScore(input: ScoreInput): {
  total: number;
  breakdown: ScoreBreakdown;
} {
  const breakdown: ScoreBreakdown = {
    interest: calculateInterestScore(input.userTags, input.eventCategory),
    distance: calculateDistanceScore(input.distanceKm, input.userRadius),
    time: calculateTimeScore(input.startTime),
    engagement: calculateEngagementScore(input.categoryEventCount),
    popularity: calculatePopularityScore(input.participantCount, input.capacity),
    timeOfDay: calculateTimeOfDayScore(input.startTime, input.preferredHours),
  };

  const total = breakdown.interest + breakdown.distance + breakdown.time
    + breakdown.engagement + breakdown.popularity + breakdown.timeOfDay;

  return { total, breakdown };
}

// ===========================================
// FALLBACK THRESHOLDS
// ===========================================

// Minimum interest score to be considered "interest-matched"
export const INTEREST_MATCH_THRESHOLD = 22;

// Check if an event qualifies for interest-based recommendations
export function hasInterestMatch(interestScore: number): boolean {
  return interestScore >= INTEREST_MATCH_THRESHOLD;
}
