// Main recommendation hook
// Combines all data sources and returns scored, filtered events

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFilters, type Filters } from './useFilters';
import { useUserLocation } from './useUserLocation';
import { useUserEngagement } from './useUserEngagement';
import {
  getRecommendationsAsync,
  getFallbackMessage,
  toGridEventDataArray,
  type ScoredEvent,
  type FallbackType,
} from '../services/events';
import { supabase } from '../lib/supabase';
import { invalidatePrefix } from '../lib/cache';
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

  // Refresh
  refresh: () => void;
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
  const { engagementByCategory, preferredHours, isLoading: isEngagementLoading } = useUserEngagement();
  const filterState = useFilters(options.initialFilters);

  // State for async recommendation results
  const [scoredEvents, setScoredEvents] = useState<ScoredEvent[]>([]);
  const [gridEvents, setGridEvents] = useState<GridEventData[]>([]);
  const [fallbackUsed, setFallbackUsed] = useState<FallbackType>('any');
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!profile) {
      setScoredEvents([]);
      setGridEvents([]);
      setFallbackUsed('any');
      setTotalAvailable(0);
      setIsLoadingEvents(false);
      return;
    }

    setIsLoadingEvents(true);

    try {
      const result = await getRecommendationsAsync({
        userProfile: profile,
        userLocation: location,
        engagementByCategory,
        preferredHours,
        filterCategories: filterState.filters.categories,
        filterTimeRange: filterState.filters.timeRange,
        filterSearch: filterState.filters.search,
        maxDistance: options.maxDistance,
      });

      setScoredEvents(result.events);
      setGridEvents(toGridEventDataArray(result.events));
      setFallbackUsed(result.fallbackUsed);
      setTotalAvailable(result.totalAvailable);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setScoredEvents([]);
      setGridEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [
    profile,
    location,
    engagementByCategory,
    preferredHours,
    filterState.filters.categories,
    filterState.filters.timeRange,
    filterState.filters.search,
    options.maxDistance,
    refreshTrigger,
  ]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Real-time subscription: refresh when events are inserted, updated, or deleted
  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          invalidatePrefix('events:');
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Generate fallback message
  const fallbackMessage = getFallbackMessage(fallbackUsed);

  // Combined loading state
  const isLoading = isLocationLoading || isEngagementLoading || isLoadingEvents;

  return {
    // Event data
    events: gridEvents,
    scoredEvents,

    // Status
    isLoading,
    fallbackUsed,
    fallbackMessage,
    totalAvailable,

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

    // Refresh
    refresh,
  };
}
