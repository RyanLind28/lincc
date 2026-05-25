import { useState, useEffect } from 'react';
import { Star, Flag, MessageSquare } from 'lucide-react';
import { Avatar, GradientButton, BottomSheet, Badge, TextArea } from '../ui';
import {
  getGuestReviewsForEvent,
  submitGuestReply,
  disputeGuestReview,
  type GuestReview,
} from '../../services/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface GuestReviewsListProps {
  eventId: string;
  hostId: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-warning text-warning' : 'text-muted'}`}
        />
      ))}
    </div>
  );
}

export function GuestReviewsList({ eventId, hostId }: GuestReviewsListProps) {
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [replyingTo, setReplyingTo] = useState<GuestReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [disputingReview, setDisputingReview] = useState<GuestReview | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const isHost = user?.id === hostId;

  const refresh = () => {
    getGuestReviewsForEvent(eventId).then(({ data }) => setReviews(data));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Only show this list to the host or to the guest who was reviewed
  const visibleReviews = reviews.filter(
    (r) => isHost || r.guest_id === user?.id,
  );

  const handleReply = async () => {
    if (!replyingTo) return;
    setIsSubmitting(true);
    const result = await submitGuestReply(replyingTo.id, replyText);
    setIsSubmitting(false);
    if (result.success) {
      showToast('Reply posted', 'success');
      setReplyingTo(null);
      setReplyText('');
      refresh();
    } else {
      showToast(result.error || 'Failed to post reply', 'error');
    }
  };

  const handleDispute = async () => {
    if (!disputingReview || !user?.id) return;
    setIsSubmitting(true);
    const result = await disputeGuestReview(disputingReview.id, user.id, disputeReason);
    setIsSubmitting(false);
    if (result.success) {
      showToast('Dispute raised — admins will review', 'success');
      setDisputingReview(null);
      setDisputeReason('');
      refresh();
    } else {
      showToast(result.error || 'Failed to raise dispute', 'error');
    }
  };

  if (visibleReviews.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-text mb-3">Guest reviews</h3>
      <div className="space-y-3">
        {visibleReviews.map((review) => {
          const isOwnReview = review.guest_id === user?.id;
          const canReply = isOwnReview && !review.guest_reply;
          const canDispute = !review.is_disputed && (isHost || isOwnReview);

          return (
            <div key={review.id} className="bg-surface rounded-xl border border-border p-3">
              <div className="flex gap-3">
                <Avatar src={review.guest?.avatar_url ?? null} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-text">
                      {review.guest?.first_name || 'Guest'}
                    </span>
                    <StarRow rating={review.guest_rating} />
                    <span className="text-xs text-text-light ml-auto">
                      {formatRelativeTime(review.created_at)}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-text-muted">{review.comment}</p>}

                  {review.is_disputed && (
                    <div className="mt-2">
                      <Badge variant="warning" size="sm">Disputed — under review</Badge>
                    </div>
                  )}

                  {review.guest_reply && (
                    <div className="mt-3 pl-3 border-l-2 border-purple/40">
                      <p className="text-xs font-medium text-purple mb-0.5">Guest replied</p>
                      <p className="text-sm text-text-muted">{review.guest_reply}</p>
                      {review.guest_replied_at && (
                        <p className="text-xs text-text-light mt-0.5">
                          {formatRelativeTime(review.guest_replied_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {(canReply || canDispute) && (
                    <div className="mt-2 flex gap-3">
                      {canReply && (
                        <button
                          onClick={() => { setReplyingTo(review); setReplyText(''); }}
                          className="flex items-center gap-1 text-xs font-medium text-purple hover:text-purple/80"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      )}
                      {canDispute && (
                        <button
                          onClick={() => { setDisputingReview(review); setDisputeReason(''); }}
                          className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Raise dispute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomSheet
        isOpen={!!replyingTo}
        onClose={() => { setReplyingTo(null); setReplyText(''); }}
        title="Reply to review"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">You can post one reply per review.</p>
          <TextArea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Thanks for the feedback…"
            rows={3}
            maxLength={500}
            showCount
          />
          <GradientButton onClick={handleReply} isLoading={isSubmitting} disabled={!replyText.trim()} fullWidth>
            Post reply
          </GradientButton>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={!!disputingReview}
        onClose={() => { setDisputingReview(null); setDisputeReason(''); }}
        title="Raise a dispute"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Tell us what's wrong with this review. An admin will look into it.
          </p>
          <TextArea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue (e.g. inaccurate, abusive, off-topic)"
            rows={3}
            maxLength={500}
            showCount
          />
          <GradientButton onClick={handleDispute} isLoading={isSubmitting} disabled={!disputeReason.trim()} fullWidth>
            Submit dispute
          </GradientButton>
        </div>
      </BottomSheet>
    </div>
  );
}
