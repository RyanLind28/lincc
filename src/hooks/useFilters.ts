import { useState, useCallback, useMemo } from 'react';

export interface Filters {
  search: string;
  categories: string[];
  timeRange: string | null;
  distance: string | null;
  audience: string | null;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  categories: [],
  timeRange: null,
  distance: null,
  audience: null,
};

export function useFilters(initialFilters: Partial<Filters> = {}) {
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const clearFilter = useCallback((key: keyof Filters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(DEFAULT_FILTERS[key]) ? [] : DEFAULT_FILTERS[key],
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilters = useMemo(() => {
    const active: { key: string; label: string }[] = [];

    if (filters.timeRange) {
      const timeLabels: Record<string, string> = {
        now: 'Happening now',
        '1hr': 'Within 1 hour',
        today: 'Later today',
      };
      active.push({ key: 'timeRange', label: timeLabels[filters.timeRange] || filters.timeRange });
    }

    if (filters.distance) {
      const distanceLabels: Record<string, string> = {
        '1km': '< 1 km',
        '5km': '< 5 km',
        '10km': '< 10 km',
      };
      active.push({ key: 'distance', label: distanceLabels[filters.distance] || filters.distance });
    }

    if (filters.audience) {
      const audienceLabels: Record<string, string> = {
        everyone: 'Everyone',
        women: 'Women only',
      };
      active.push({ key: 'audience', label: audienceLabels[filters.audience] || filters.audience });
    }

    filters.categories.forEach((cat) => {
      active.push({ key: `category-${cat}`, label: cat });
    });

    return active;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0 || filters.search.length > 0;

  return {
    filters,
    setFilters,
    updateFilter,
    toggleCategory,
    clearFilter,
    clearAll,
    activeFilters,
    hasActiveFilters,
  };
}

// Time range options
export const TIME_OPTIONS = [
  { value: 'now', label: 'Now', icon: '🔴' },
  { value: '1hr', label: '< 1hr', icon: '⏰' },
  { value: 'today', label: 'Today', icon: '📅' },
];

// Distance options
export const DISTANCE_OPTIONS = [
  { value: '1km', label: '< 1 km' },
  { value: '5km', label: '< 5 km' },
  { value: '10km', label: '< 10 km' },
];

// Audience options
export const AUDIENCE_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'women', label: 'Women only' },
];
