import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { subscribeToPush, unsubscribeFromPush, getSubscription } from '../services/pushService';

interface UsePushNotificationsResult {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing subscription on mount
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const sub = await getSubscription();
      if (!cancelled) {
        setIsSubscribed(sub !== null);
        setIsLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [user?.id]);

  const subscribe = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const result = await subscribeToPush(user.id);
    setPermission('Notification' in window ? Notification.permission : 'default');
    if (result.success) {
      setIsSubscribed(true);
      showToast('Notifications enabled', 'success');
    } else {
      showToast(result.error || 'Failed to enable notifications', 'error');
    }
    setIsLoading(false);
  }, [user?.id, showToast]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const result = await unsubscribeFromPush(user.id);
    if (result.success) {
      setIsSubscribed(false);
      showToast('Notifications disabled', 'success');
    } else {
      showToast(result.error || 'Failed to disable notifications', 'error');
    }
    setIsLoading(false);
  }, [user?.id, showToast]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
