// Main recommendation hook
// Combines all data sources and returns scored, filtered events

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFilters, type Filters } from './useFilters';
import { useUserLocation } from './useUserLocation';
import { useUserEngagement } from './useUserEngagement';
import {
  getRecommendations,
  getFallbackMessage,
  toGridEventDataArray,
  type ScoredEvent,
  type FallbackType,
} from '../services/events';
import type { GridEventData } from '../components/ui/EventCardGrid';

interface UseRecommendedEventsResult {
  // Event data
  events: GridEventData[];
  scoredEvents: ScoredEvent[];

  // Status
  isLoading: boolean;
  fallbackUsed: FallbackType;
  fallbackMessage: string | null;
  totalAvailable: number;

  // Filter controls (from useFilters)
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  toggleCategory: (category: string) => void;
  clearFilter: (key: keyof Filters) => void;
  clearAll: () => void;
  activeFilters: Array<{ key: string; label: string }>;
  hasActiveFilters: boolean;

  // Location
  hasLocation: boolean;
  locationError: string | null;
  refreshLocation: () => void;
}

interface UseRecommendedEventsOptions {
  maxDistance?: number;
  initialFilters?: Partial<Filters>;
}

export function useRecommendedEvents(
  options: UseRecommendedEventsOptions = {}
): UseRecommendedEventsResult {
  const { profile } = useAuth();
  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    hasPermission,
    refresh: refreshLocation,
  } = useUserLocation();
  const { engagementByCategory, isLoading: isEngagementLoading } = useUserEngagement();
  const filterState = useFilters(options.initialFilters);

  // Get recommendations using memoization
  const recommendationResult = useMemo(() => {
    if (!profile) {
      return {
        events: [],
        fallbackUsed: 'any' as FallbackType,
        totalAvailable: 0,
      };
    }

    return getRecommendations({
      userProfile: profile,
      userLocation: location,
      engagementByCategory,
      filterCategories: filterState.filters.categories,
      filterTimeRange: filterState.filters.timeRange,
      filterSearch: filterState.filters.search,
      maxDistance: options.maxDistance,
    });
  }, [
    profile,
    location,
    engagementByCategory,
    filterState.filters.categories,
    filterState.filters.timeRange,
    filterState.filters.search,
    options.maxDistance,
  ]);

  // Transform to GridEventData
  const gridEvents = useMemo(
    () => toGridEventDataArray(recommendationResult.events),
    [recommendationResult.events]
  );

  // Generate fallback message
  const fallbackMessage = getFallbackMessage(recommendationResult.fallbackUsed);

  // Combined loading state
  const isLoading = isLocationLoading || isEngagementLoading;

  return {
    // Event data
    events: gridEvents,
    scoredEvents: recommendationResult.events,

    // Status
    isLoading,
    fallbackUsed: recommendationResult.fallbackUsed,
    fallbackMessage,
    totalAvailable: recommendationResult.totalAvailable,

    // Filter controls
    filters: filterState.filters,
    updateFilter: filterState.updateFilter,
    toggleCategory: filterState.toggleCategory,
    clearFilter: filterState.clearFilter,
    clearAll: filterState.clearAll,
    activeFilters: filterState.activeFilters,
    hasActiveFilters: filterState.hasActiveFilters,

    // Location
    hasLocation: hasPermission,
    locationError,
    refreshLocation,
  };
}
