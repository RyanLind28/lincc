import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Avatar, GradientButton, TextArea } from '../ui';
import { getEventReviews, submitReview, hasUserReviewed } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles: { first_name: string; avatar_url: string | null } | null;
}

interface EventReviewsProps {
  eventId: string;
  isExpired: boolean;
  isParticipant: boolean;
}

function StarRating({ rating, onChange, interactive = false }: { rating: number; onChange?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`h-5 w-5 ${i <= rating ? 'fill-warning text-warning' : 'text-gray-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function EventReviews({ eventId, isExpired, isParticipant }: EventReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    getEventReviews(eventId).then(({ data }) => setReviews(data as unknown as Review[]));
    if (user?.id) {
      hasUserReviewed(eventId, user.id).then(setAlreadyReviewed);
    }
  }, [eventId, user?.id]);

  const handleSubmit = async () => {
    if (!user?.id || rating === 0) return;
    setIsSubmitting(true);
    const result = await submitReview(eventId, user.id, rating, comment);
    if (result.success) {
      showToast('Review submitted', 'success');
      setShowForm(false);
      setAlreadyReviewed(true);
      getEventReviews(eventId).then(({ data }) => setReviews(data as unknown as Review[]));
    } else {
      showToast(result.error || 'Failed', 'error');
    }
    setIsSubmitting(false);
  };

  const canReview = isExpired && isParticipant && !alreadyReviewed;

  if (reviews.length === 0 && !canReview) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text">Reviews</h3>
        {canReview && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm text-coral font-medium">
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-3 space-y-3">
          <StarRating rating={rating} onChange={setRating} interactive />
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the event? (optional)"
            rows={2}
            maxLength={280}
            showCount
          />
          <div className="flex gap-2">
            <GradientButton onClick={handleSubmit} isLoading={isSubmitting} disabled={rating === 0}>
              Submit
            </GradientButton>
            <button onClick={() => setShowForm(false)} className="text-sm text-text-muted">Cancel</button>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface rounded-xl border border-border p-3 flex gap-3">
              <Avatar src={(review.profiles as { first_name: string; avatar_url: string | null } | null)?.avatar_url ?? null} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text">
                    {(review.profiles as { first_name: string; avatar_url: string | null } | null)?.first_name || 'User'}
                  </span>
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-text-light ml-auto">{formatRelativeTime(review.created_at)}</span>
                </div>
                {review.comment && <p className="text-sm text-text-muted">{review.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
