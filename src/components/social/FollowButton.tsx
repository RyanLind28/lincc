import { useState } from 'react';
import { followUser, unfollowUser } from '../../services/followService';
import { cn } from '../../lib/utils';

interface FollowButtonProps {
  /** Current user's ID (the follower) */
  currentUserId: string;
  /** Target user's ID (to follow/unfollow) */
  targetUserId: string;
  /** Initial follow state — pass in from parent so the button renders instantly */
  initiallyFollowing: boolean;
  /** Optional callback when state changes */
  onChange?: (following: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Compact Follow / Following toggle button with optimistic UI.
 * Use in lists / search rows where follow state is known upfront.
 */
export function FollowButton({
  currentUserId,
  targetUserId,
  initiallyFollowing,
  onChange,
  size = 'sm',
  className,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    const next = !following;
    setFollowing(next); // optimistic
    setIsPending(true);

    const result = next
      ? await followUser(currentUserId, targetUserId)
      : await unfollowUser(currentUserId, targetUserId);

    setIsPending(false);
    if (!result.success) {
      setFollowing(!next); // rollback
    } else {
      onChange?.(next);
    }
  };

  const sizeClasses = size === 'md' ? 'h-10 px-4 text-sm' : 'h-8 px-3 text-xs';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'rounded-full font-semibold transition-colors flex-shrink-0 disabled:opacity-60',
        sizeClasses,
        following
          ? 'bg-surface border border-border text-text-muted hover:text-error hover:border-error'
          : 'gradient-primary text-white shadow-sm',
        className
      )}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
