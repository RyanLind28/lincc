import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar, CoverImage, GradientButton, Modal, TextArea } from '../ui';
import { getDisplayName } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  submitHostReview,
  submitGuestReview,
  dismissReviewForSession,
  dismissReviewPermanently,
  type PendingReview,
} from '../../services/reviews';

interface ReviewPromptModalProps {
  items: PendingReview[];
  onClose: () => void;
  onItemHandled: (item: PendingReview) => void;
}

function StarRow({
  rating,
  onChange,
  size = 'md',
}: {
  rating: number;
  onChange: (r: number) => void;
  size?: 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-0.5 cursor-pointer"
          aria-label={`${i} star${i === 1 ? '' : 's'}`}
        >
          <Star className={`${dim} ${i <= rating ? 'fill-warning text-warning' : 'text-muted'}`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewPromptModal({ items, onClose, onItemHandled }: ReviewPromptModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [hostRating, setHostRating] = useState(0);
  const [eventRating, setEventRating] = useState(0);
  const [guestRating, setGuestRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = items.length;
  const current = items[0];

  // Reset form when current item changes
  useEffect(() => {
    setHostRating(0);
    setEventRating(0);
    setGuestRating(0);
    setComment('');
  }, [current?.kind, current && (current.kind === 'guest' ? current.guest.id : current.event.id)]);

  const advance = (item: PendingReview) => {
    onItemHandled(item);
    if (total <= 1) {
      onClose();
    }
    // total decreases as parent removes the item; index stays put which now points to the next item
  };

  const handleSubmit = async () => {
    if (!current || !user?.id) return;

    if (current.kind === 'host') {
      if (hostRating === 0 || eventRating === 0) {
        showToast('Please rate both the host and the event', 'error');
        return;
      }
      setIsSubmitting(true);
      const result = await submitHostReview(
        current.event.id,
        user.id,
        hostRating,
        eventRating,
        comment,
      );
      setIsSubmitting(false);
      if (!result.success) {
        showToast(result.error || 'Failed to submit', 'error');
        return;
      }
      showToast(result.alreadyExists ? 'Already submitted — moving on' : 'Thanks for your review', 'success');
      advance(current);
    } else {
      if (guestRating === 0) {
        showToast('Please rate the guest', 'error');
        return;
      }
      setIsSubmitting(true);
      const result = await submitGuestReview(
        current.event.id,
        user.id,
        current.guest.id,
        guestRating,
        comment,
      );
      setIsSubmitting(false);
      if (!result.success) {
        showToast(result.error || 'Failed to submit', 'error');
        return;
      }
      showToast(result.alreadyExists ? 'Already submitted — moving on' : 'Guest rated', 'success');
      advance(current);
    }
  };

  const handleSkipForNow = () => {
    if (!current) return;
    dismissReviewForSession(current);
    advance(current);
  };

  const handleSkipPermanently = () => {
    if (!current) return;
    dismissReviewPermanently(current);
    advance(current);
  };

  const headerTitle = useMemo(() => {
    if (!current) return '';
    return current.kind === 'host' ? 'How was the event?' : 'Rate your guest';
  }, [current]);

  if (!current) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={total > 1 ? `${headerTitle} · ${total} to go` : headerTitle}
      size="sm"
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        {/* Event header */}
        <div className="flex items-center gap-3 bg-background rounded-xl p-3">
          <CoverImage
            src={current.event.cover_image_url}
            alt={current.event.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text truncate">{current.event.title}</p>
            {current.event.venue_name && (
              <p className="text-xs text-text-light truncate">{current.event.venue_name}</p>
            )}
          </div>
        </div>

        {current.kind === 'host' ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar src={current.event.host.avatar_url} size="md" />
              <div className="flex-1">
                <p className="text-sm text-text-muted">Your host</p>
                <p className="font-medium text-text">{getDisplayName(current.event.host)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text mb-2">Rate {getDisplayName(current.event.host)}</p>
              <StarRow rating={hostRating} onChange={setHostRating} size="lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-text mb-2">Rate the event</p>
              <StarRow rating={eventRating} onChange={setEventRating} size="lg" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar src={current.guest.avatar_url} size="md" />
              <div className="flex-1">
                <p className="text-sm text-text-muted">Your guest</p>
                <p className="font-medium text-text">{getDisplayName(current.guest)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text mb-2">Rate {getDisplayName(current.guest)}</p>
              <StarRow rating={guestRating} onChange={setGuestRating} size="lg" />
            </div>
          </>
        )}

        <TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          rows={2}
          maxLength={280}
          showCount
        />

        <GradientButton onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
          Submit
        </GradientButton>

        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={handleSkipForNow}
            className="text-text-muted hover:text-text"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSkipPermanently}
            className="text-text-light hover:text-text-muted"
          >
            Don't ask again
          </button>
        </div>
      </div>
    </Modal>
  );
}
