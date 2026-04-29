import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchPendingReviews,
  isReviewDismissed,
  type PendingReview,
} from '../services/reviews';

export function usePendingReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    const all = await fetchPendingReviews(user.id);
    setItems(all.filter((it) => !isReviewDismissed(it)));
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistic local removal once a user submits or dismisses
  const removeFromQueue = useCallback((item: PendingReview) => {
    setItems((prev) =>
      prev.filter((it) => {
        if (it.kind !== item.kind) return true;
        if (it.event.id !== item.event.id) return true;
        if (it.kind === 'guest' && item.kind === 'guest') {
          return it.guest.id !== item.guest.id;
        }
        return false;
      }),
    );
  }, []);

  return { items, isLoading, refresh, removeFromQueue };
}
