import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Inbox, ArrowRight } from 'lucide-react';
import { Header } from '../components/layout';
import { Spinner } from '../components/ui';
import { ReviewPromptModal } from '../components/features/ReviewPromptModal';
import { usePendingReviews } from '../hooks/usePendingReviews';
import { dismissReviewForSession } from '../services/reviews';

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const focusEventId = searchParams.get('event');
  const { items, isLoading, removeFromQueue, clearQueue, refresh } = usePendingReviews();
  const [isOpen, setIsOpen] = useState(false);

  // Prefer the event the notification deep-linked to. If that event has no
  // pending reviews any more, fall through to whatever else is pending.
  const queue = useMemo(() => {
    if (!focusEventId) return items;
    const focused = items.filter((i) => i.event.id === focusEventId);
    return focused.length > 0 ? focused : items;
  }, [items, focusEventId]);

  // Open the modal as soon as we know there's anything to review.
  useEffect(() => {
    if (!isLoading && queue.length > 0) setIsOpen(true);
  }, [isLoading, queue.length]);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header title="Reviews" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral/10 to-purple/10 text-warning flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Pending reviews</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            A short rating helps people trust who's hosting and who's joining. Takes a few seconds.
          </p>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : queue.length === 0 ? (
          <section className="bg-surface rounded-2xl border border-border p-8 text-center">
            <Inbox className="h-10 w-10 text-text-light mx-auto mb-3" />
            <h2 className="font-semibold text-text mb-1">You're all caught up</h2>
            <p className="text-sm text-text-muted mb-5">No reviews waiting for you right now.</p>
            <Link
              to="/my-events"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-border text-sm font-medium text-text hover:border-coral hover:text-coral transition-colors"
            >
              View past events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="bg-surface rounded-2xl border border-border p-6 text-center">
            <p className="text-sm text-text-muted mb-4">
              {queue.length === 1
                ? '1 review waiting'
                : `${queue.length} reviews waiting`}
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 transition-all"
            >
              <Star className="h-4 w-4" />
              {queue.length === 1 ? 'Review now' : 'Start reviewing'}
            </button>
          </section>
        )}
      </main>

      {isOpen && queue.length > 0 && (
        <ReviewPromptModal
          items={queue}
          onClose={() => {
            queue.forEach(dismissReviewForSession);
            clearQueue();
            setIsOpen(false);
            refresh();
          }}
          onItemHandled={removeFromQueue}
        />
      )}
    </div>
  );
}
