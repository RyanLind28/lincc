import { useState, useEffect } from 'react';
import { Link2, Check, Send, Loader2 } from 'lucide-react';
import { BottomSheet, Avatar } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getFollowing, type FollowProfile } from '../../services/followService';
import { createNotification } from '../../services/notificationService';
import { getOrCreateConversation, sendDirectMessage } from '../../services/chat/dmService';
import type { VoucherWithDetails, NotificationType } from '../../types';

interface ShareVoucherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherWithDetails;
}

export function ShareVoucherSheet({ isOpen, onClose, voucher }: ShareVoucherSheetProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      const data = await getFollowing(user.id);
      setFollowing(data);
      setLoadingFollowing(false);
    };
    fetchFollowing();
  }, [isOpen, user?.id]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSentTo(new Set());
      setSendingTo(null);
      setLinkCopied(false);
    }
  }, [isOpen]);

  const handleExternalShare = async () => {
    const shareUrl = `${window.location.origin}/voucher/${voucher.id}`;
    const shareData = {
      title: voucher.title,
      text: `Check out this deal: ${voucher.discount_text} at ${voucher.venue_name}!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleSendToFriend = async (friend: FollowProfile) => {
    if (!user?.id || sentTo.has(friend.id)) return;
    setSendingTo(friend.id);

    try {
      let anySent = false;

      // Try to create DM conversation (best-effort — tables may not exist yet)
      try {
        const convoResult = await getOrCreateConversation(user.id, friend.id);
        if (convoResult.success && convoResult.data) {
          const dmResult = await sendDirectMessage(
            convoResult.data.id,
            user.id,
            `${voucher.discount_text} - ${voucher.title} at ${voucher.venue_name}`,
            'voucher_share',
            { voucher_id: voucher.id }
          );
          if (dmResult.success) anySent = true;
        }
      } catch {
        // DM tables may not exist yet — continue with notification
      }

      // Also send notification
      const result = await createNotification(
        friend.id,
        'voucher_shared' as NotificationType,
        `${user.id === voucher.business_id ? voucher.venue_name : 'A friend'} shared a voucher`,
        `${voucher.discount_text} - ${voucher.title} at ${voucher.venue_name}`,
        { voucher_id: voucher.id, sender_id: user.id }
      );
      if (result.success) anySent = true;

      if (anySent) {
        setSentTo((prev) => new Set(prev).add(friend.id));
      } else {
        showToast('Failed to send', 'error');
      }
    } catch {
      showToast('Failed to send', 'error');
    }
    setSendingTo(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share Voucher" height="half">
      <div className="space-y-5">
        {/* External share */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            Share Link
          </h3>
          <button
            onClick={handleExternalShare}
            className="flex items-center gap-3 w-full p-3 rounded-xl border border-border
                       hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
              {linkCopied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Link2 className="h-5 w-5 text-coral" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text">
                {linkCopied ? 'Link copied!' : 'Copy link or share'}
              </p>
              <p className="text-xs text-text-muted">Share via messages, social media, etc.</p>
            </div>
          </button>
        </div>

        {/* Send to friend */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            Send to a Friend
          </h3>

          {loadingFollowing ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : following.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              You're not following anyone yet.
            </p>
          ) : (
            <div className="space-y-1">
              {following.map((friend) => {
                const isSent = sentTo.has(friend.id);
                const isSending = sendingTo === friend.id;

                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Avatar
                      src={friend.avatar_url}
                      name={friend.first_name}
                      size="sm"
                    />
                    <span className="flex-1 text-sm font-medium text-text truncate">
                      {friend.first_name}
                    </span>
                    <button
                      onClick={() => handleSendToFriend(friend)}
                      disabled={isSent || isSending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSent
                          ? 'bg-green-50 text-green-600'
                          : 'gradient-primary text-white hover:opacity-90'
                      } disabled:opacity-70`}
                    >
                      {isSending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSent ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
