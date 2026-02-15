// User engagement hook
// Tracks past event participation by category and preferred activity hours

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// DEV_MODE flag - matches AuthContext
const DEV_MODE = false;

// Mock engagement data for development
const MOCK_ENGAGEMENT: Record<string, number> = {
  coffee: 3,      // User has joined 3 coffee events
  wellness: 2,    // 2 wellness events
  outdoors: 1,    // 1 outdoor event
  hiking: 1,      // 1 hiking event (maps to outdoors)
};

const MOCK_PREFERRED_HOURS = [17, 18, 19, 20];

interface UseUserEngagementResult {
  engagementByCategory: Record<string, number>;
  preferredHours: number[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUserEngagement(): UseUserEngagementResult {
  const { user } = useAuth();
  const [engagementByCategory, setEngagementByCategory] = useState<Record<string, number>>(
    DEV_MODE ? MOCK_ENGAGEMENT : {}
  );
  const [preferredHours, setPreferredHours] = useState<number[]>(
    DEV_MODE ? MOCK_PREFERRED_HOURS : []
  );
  const [isLoading, setIsLoading] = useState(!DEV_MODE);
  const [error, setError] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchEngagement = async () => {
      if (DEV_MODE) {
        if (isMounted) {
          setEngagementByCategory(MOCK_ENGAGEMENT);
          setPreferredHours(MOCK_PREFERRED_HOURS);
          setIsLoading(false);
        }
        return;
      }

      if (!user) {
        if (isMounted) {
          setEngagementByCategory({});
          setPreferredHours([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        // Fetch user's past event participation with approved status
        const { data, error: fetchError } = await supabase
          .from('event_participants')
          .select(`
            event_id,
            events:event_id (
              start_time,
              category_id,
              categories:category_id (
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (!isMounted) return;

        if (fetchError) {
          throw fetchError;
        }

        // Aggregate by category and collect start hours
        const categoryCount: Record<string, number> = {};
        const hourCounts: Record<number, number> = {};

        for (const participation of data || []) {
          const eventData = (participation as {
            events?: {
              start_time?: string;
              categories?: { name?: string };
            };
          }).events;

          const categoryName = eventData?.categories?.name?.toLowerCase();
          if (categoryName) {
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
          }

          // Track activity hours
          if (eventData?.start_time) {
            const hour = new Date(eventData.start_time).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        }

        setEngagementByCategory(categoryCount);
        setPreferredHours(computePreferredHours(hourCounts));
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching engagement:', err);
        setError(err instanceof Error ? err.message : 'Failed to load engagement');
        setEngagementByCategory({});
        setPreferredHours([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEngagement();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshTrigger]);

  const refresh = useCallback(async () => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    engagementByCategory,
    preferredHours,
    isLoading,
    error,
    refresh,
  };
}

// Helper to get engagement count for a specific category
export function getEngagementCount(
  engagementByCategory: Record<string, number>,
  categoryValue: string
): number {
  return engagementByCategory[categoryValue] || 0;
}

/**
 * Compute a 4-hour preferred window from past event start hours.
 * Returns the most common 4 consecutive hours, or empty if no data.
 */
function computePreferredHours(hourCounts: Record<number, number>): number[] {
  const entries = Object.entries(hourCounts);
  if (entries.length === 0) return [];

  // Find the best 4-hour window (sliding window over 24h)
  let bestStart = 0;
  let bestSum = 0;

  for (let start = 0; start < 24; start++) {
    let sum = 0;
    for (let offset = 0; offset < 4; offset++) {
      const hour = (start + offset) % 24;
      sum += hourCounts[hour] || 0;
    }
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = start;
    }
  }

  return [bestStart, (bestStart + 1) % 24, (bestStart + 2) % 24, (bestStart + 3) % 24];
}
