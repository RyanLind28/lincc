import { logger } from '../lib/utils';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!VAPID_PUBLIC_KEY) {
      return { success: false, error: 'Push notifications not configured' };
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('Push subscription failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function unsubscribeFromPush(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    logger.error('Push unsubscribe failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Self-heal the push subscription state. A user can end up "subscribed" in the
 * browser but with no matching `push_subscriptions` row — our stale-cleanup
 * (410/404) can delete the row, the browser can rotate/drop the subscription,
 * or it was created on a device whose row was later removed. In that state the
 * edge function finds nothing and silently sends no push, even though the UI
 * shows notifications as on.
 *
 * When permission is already granted, re-derive the current browser
 * subscription (recreating it if the browser dropped it) and upsert it so the
 * DB always matches reality. Silent by design: it never prompts (permission is
 * already granted) and never throws — safe to call on every app load.
 *
 * Returns true if a subscription row is present in the DB afterwards.
 */
export async function syncPushSubscription(userId: string): Promise<boolean> {
  try {
    if (!VAPID_PUBLIC_KEY) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return false;
    }
    // Only sync when the user has already granted permission — never trigger a
    // permission prompt from here.
    if (Notification.permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      // Permission granted but the browser has no subscription (it was dropped
      // or never created). Recreate it — subscribe() resolves without a prompt
      // when permission is already granted.
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );
    if (error) {
      logger.error('Push subscription sync failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('Push subscription sync failed:', err);
    return false;
  }
}

export async function getSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
