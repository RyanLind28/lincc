// Hook for managing bookmarked/saved events

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  saveEvent,
  unsaveEvent,
  getSavedEventIds,
  getSavedEvents,
} from '../services/bookmarkService';
import type { EventWithDetails } from '../types';

export function useBookmarks() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedEvents, setSavedEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved event IDs on mount
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadSavedIds = async () => {
      const ids = await getSavedEventIds(user.id);
      if (!cancelled) {
        setSavedIds(new Set(ids));
      }
    };

    loadSavedIds();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isSaved = useCallback(
    (eventId: string) => savedIds.has(eventId),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (eventId: string) => {
      if (!user?.id) return;

      const wasSaved = savedIds.has(eventId);

      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
        return next;
      });

      const result = wasSaved
        ? await unsaveEvent(user.id, eventId)
        : await saveEvent(user.id, eventId);

      // Revert on failure
      if (!result.success) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) {
            next.add(eventId);
          } else {
            next.delete(eventId);
          }
          return next;
        });
      }

      return result;
    },
    [user?.id, savedIds]
  );

  const loadSavedEvents = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const events = await getSavedEvents(user.id);
    setSavedEvents(events);
    setIsLoading(false);
  }, [user?.id]);

  return {
    savedIds,
    savedEvents,
    isLoading,
    isSaved,
    toggleSave,
    loadSavedEvents,
    savedCount: savedIds.size,
  };
}
