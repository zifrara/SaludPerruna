/**
 * Salud Perruna — Notification Service
 *
 * Local push notifications powered by expo-notifications.
 * No Supabase required: all notifications are scheduled on-device.
 *
 * NOTE: expo-notifications Android push support was removed from Expo Go
 * in SDK 53. We use require() so the import error can be caught gracefully.
 * All functions become no-ops when running in Expo Go — use a development
 * build to test real notifications.
 *
 * Rules per dog (evaluated every time the app comes to foreground
 * or any relevant state changes):
 *   🍳 09:30 — Breakfast reminder  (skipped if already marked)
 *   🚨 12:00 / 16:00 / 20:00 — Poop urgent (skipped if poop_count > 0)
 *   🍖 20:30 — Dinner reminder     (skipped if already marked)
 */

import { Platform } from 'react-native';
import type { Dog, DailyRecord } from '../types';

// ─── Lazy-load expo-notifications ────────────────────────────────────────────
// expo-notifications throws on import in Expo Go (SDK 53+), so we require()
// it inside a try/catch and degrade gracefully when unavailable.

type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as NotificationsModule;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  if (__DEV__) {
    console.log(
      '[notifications] expo-notifications not available in Expo Go — ' +
      'use a development build to test push notifications.',
    );
  }
}

// ─── Permission ──────────────────────────────────────────────────────────────

/**
 * Request OS notification permission.
 * Returns true if granted (or already granted), false on web / denied.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Scheduling ──────────────────────────────────────────────────────────────

/**
 * Cancel all scheduled notifications and rebuild them from current dog state.
 *
 * Call this:
 *  - After requesting permission (first launch)
 *  - When AppState changes to 'active' (app resumes from background)
 *  - After any meal toggle, pee increment, or poop increment
 *
 * On web: no-op (expo-notifications is not supported there).
 */
export async function rescheduleNotifications(
  dogs: Dog[],
  getRecord: (dogId: string) => DailyRecord,
): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const nowTotalMins = now.getHours() * 60 + now.getMinutes();

    for (const dog of dogs) {
      const record = getRecord(dog.id);

      // ── 🍳 Desayuno — 09:30 ──────────────────────────
      if (!record.breakfastAt) {
        await scheduleAt(9, 30, nowTotalMins, {
          title: `🍳 ¿${dog.name} ya desayunó?`,
          body: 'No olvides marcar el desayuno en la app.',
          data: { dogId: dog.id, type: 'breakfast', route: '/(tabs)' },
        });
      }

      // ── 🚨 Caca urgente — 12:00 / 16:00 / 20:00 ─────
      if (record.poopCount === 0) {
        const urgentSlots: [number, number][] = [[12, 0], [16, 0], [20, 0]];
        for (const [h, m] of urgentSlots) {
          await scheduleAt(h, m, nowTotalMins, {
            title: `🚨 ¡${dog.name} necesita hacer caca!`,
            body: 'Lleva todo el día sin hacer sus necesidades. Sácalo cuanto antes.',
            data: { dogId: dog.id, type: 'poop_urgent', route: `/(tabs)/walk` },
          });
        }
      }

      // ── 🍖 Cena — 20:30 ──────────────────────────────
      if (!record.dinnerAt) {
        await scheduleAt(20, 30, nowTotalMins, {
          title: `🍖 ¿${dog.name} ya cenó?`,
          body: 'No olvides marcar la cena en la app.',
          data: { dogId: dog.id, type: 'dinner', route: '/(tabs)' },
        });
      }
    }
  } catch (err) {
    if (__DEV__) console.warn('[notifications] reschedule error:', err);
  }
}

// ─── Tap navigation ──────────────────────────────────────────────────────────

/**
 * Listen for notification taps and invoke the provided navigate callback.
 * The callback receives the route string stored in notification.data.route.
 *
 * Usage in _layout.tsx:
 *   const sub = addTapListener((route) => router.push(route as any));
 *   return () => sub.remove();
 */
export function addTapListener(
  navigate: (route: string) => void,
): { remove: () => void } {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response.notification.request.content.data?.route as string | undefined;
    if (route) navigate(route);
  });
}

// ─── Internal helpers ────────────────────────────────────────────────────────

type NotifContent = {
  title: string;
  body: string;
  data: Record<string, unknown>;
};

/**
 * Schedule a notification for today at hh:mm local time.
 * Silently skips if that time has already passed.
 */
async function scheduleAt(
  hour: number,
  minute: number,
  nowTotalMins: number,
  content: NotifContent,
): Promise<void> {
  if (!Notifications) return;

  const targetMins = hour * 60 + minute;
  if (targetMins <= nowTotalMins) return; // time has already passed today

  const secondsUntil = (targetMins - nowTotalMins) * 60;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
      repeats: false,
    },
  });
}
