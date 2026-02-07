// Barrel exports for events services

export { fetchEvents, fetchDemoEvents, isDevMode, createEvent, getEventById } from './eventService';
export type { FetchEventsOptions, CreateEventResult, CreateEventData } from './eventService';

export {
  getRecommendations,
  getRecommendationsAsync,
  getFallbackMessage,
  fetchActiveEvents,
} from './recommendationService';
export type {
  RecommendationResult,
  RecommendationOptions,
  FallbackType,
} from './recommendationService';

export { toScoredEvent, toGridEventData, toGridEventDataArray } from './transformers';
export type { ScoredEvent } from './transformers';

export {
  requestToJoin,
  cancelRequest,
  approveParticipant,
  rejectParticipant,
  getParticipants,
  getApprovedParticipants,
  getUserParticipation,
  getPendingRequestsCount,
  getUserApprovedEvents,
} from './participantService';
export type { ParticipantResult, ParticipantsListResult } from './participantService';
