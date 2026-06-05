import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

// Snooze rather than permanently dismiss: a one-time "Not now" used to hide the
// prompt forever, which is a big reason so few people have push enabled. Re-ask
// after a week (the next genuine moment they might want it) without nagging.
const DISMISSED_UNTIL_KEY = 'lincc-push-dismissed-until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const { permission, isSubscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    const until = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0);
    return Date.now() < until;
  });

  // Don't show if: no user, already subscribed, already decided, or snoozed
  if (!user || isSubscribed || permission !== 'default' || dismissed) return null;

  // Don't show if push is not supported
  if (!('Notification' in window) || !('PushManager' in window)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + SNOOZE_MS));
  };

  const handleEnable = async () => {
    await subscribe();
  };

  return (
    <div className="mx-4 mt-3 mb-1 lg:max-w-xl lg:mx-auto animate-slide-up">
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text text-sm">Stay in the loop</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Get notified when someone joins your event, sends you a message, or events start nearby.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleEnable}
                className="px-4 py-1.5 text-sm font-medium text-white rounded-lg gradient-primary hover:opacity-90 transition-opacity"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-text-light hover:text-text transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
