// User engagement hook
// Tracks past event participation by category

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

interface UseUserEngagementResult {
  engagementByCategory: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUserEngagement(): UseUserEngagementResult {
  const { user } = useAuth();
  const [engagementByCategory, setEngagementByCategory] = useState<Record<string, number>>(
    DEV_MODE ? MOCK_ENGAGEMENT : {}
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
          setIsLoading(false);
        }
        return;
      }

      if (!user) {
        if (isMounted) {
          setEngagementByCategory({});
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

        // Aggregate by category
        const categoryCount: Record<string, number> = {};

        for (const participation of data || []) {
          const categoryName = (participation as { events?: { categories?: { name?: string } } })
            .events?.categories?.name?.toLowerCase();
          if (categoryName) {
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
          }
        }

        setEngagementByCategory(categoryCount);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching engagement:', err);
        setError(err instanceof Error ? err.message : 'Failed to load engagement');
        setEngagementByCategory({});
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
