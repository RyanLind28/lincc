// Event Recommendation Scoring Algorithm
// All scoring weights and formulas in one place for easy tuning

import { getAllMatchingCategories, isRelatedCategory } from '../data/tagToCategoryMap';

// ===========================================
// CONFIGURABLE WEIGHTS (0-100 total)
// ===========================================
export const SCORE_WEIGHTS = {
  interest: 40,    // Max points for interest match
  distance: 25,    // Max points for distance
  time: 20,        // Max points for time relevance
  engagement: 15,  // Max points for engagement history
} as const;

// Interest scoring thresholds
export const INTEREST_THRESHOLDS = {
  directMatch: 40,   // User tag matches event category exactly
  relatedMatch: 25,  // Event category is related to user's interests
} as const;

// Time scoring thresholds (in hours)
export const TIME_THRESHOLDS = [
  { maxHours: 1, score: 20 },
  { maxHours: 3, score: 18 },
  { maxHours: 6, score: 15 },
  { maxHours: 12, score: 12 },
  { maxHours: 24, score: 10 },
  { maxHours: 48, score: 7 },
  { maxHours: 72, score: 5 },
  { maxHours: Infinity, score: 3 },
] as const;

// Engagement scoring
export const ENGAGEMENT_CONFIG = {
  maxEvents: 5,           // Cap at this many past events for max score
  pointsPerEvent: 3,      // Points per past event in category
} as const;

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
 * Calculate distance score using linear decay
 * Closer events score higher within the user's radius
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

  // Linear decay: closer = higher score
  // At 0 km: full points, at userRadius: 0 points
  const ratio = 1 - distanceKm / userRadius;
  return Math.round(ratio * SCORE_WEIGHTS.distance);
}

/**
 * Calculate time relevance score
 * Events starting sooner score higher
 * @param startTime - Event start time (Date or ISO string)
 * @returns Score from 0 to SCORE_WEIGHTS.time
 */
export function calculateTimeScore(startTime: Date | string): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const now = new Date();

  // Past events get 0
  if (start <= now) return 0;

  const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

  for (const threshold of TIME_THRESHOLDS) {
    if (hoursUntilStart <= threshold.maxHours) {
      return threshold.score;
    }
  }

  return TIME_THRESHOLDS[TIME_THRESHOLDS.length - 1].score;
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
 * Calculate total score for an event
 */
export interface ScoreBreakdown {
  interest: number;
  distance: number;
  time: number;
  engagement: number;
}

export interface ScoreInput {
  userTags: string[];
  eventCategory: string;
  distanceKm: number;
  userRadius: number;
  startTime: Date | string;
  categoryEventCount: number;
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
  };

  const total = breakdown.interest + breakdown.distance + breakdown.time + breakdown.engagement;

  return { total, breakdown };
}

// ===========================================
// FALLBACK THRESHOLDS
// ===========================================

// Minimum interest score to be considered "interest-matched"
export const INTEREST_MATCH_THRESHOLD = 25;

// Check if an event qualifies for interest-based recommendations
export function hasInterestMatch(interestScore: number): boolean {
  return interestScore >= INTEREST_MATCH_THRESHOLD;
}
