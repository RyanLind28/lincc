// Barrel exports for events services

export { fetchEvents, fetchDemoEvents, isDevMode } from './eventService';
export type { FetchEventsOptions } from './eventService';

export {
  getRecommendations,
  getFallbackMessage,
} from './recommendationService';
export type {
  RecommendationResult,
  RecommendationOptions,
  FallbackType,
} from './recommendationService';

export { toScoredEvent, toGridEventData, toGridEventDataArray } from './transformers';
export type { ScoredEvent } from './transformers';
