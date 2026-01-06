/**
 * Letter Notifications Service
 *
 * Manages local notifications for LetterToVoid feature.
 * All notifications are scheduled locally - nothing sent to server.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { LetterMetadata } from './letterStorage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification channel for Android
const CHANNEL_ID = 'void-letters';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[LetterNotifications] Permission not granted');
      return false;
    }

    // Create Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Letters from the Void',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c3aed',
        sound: 'default',
        description: 'Notifications when your letters to the void are ready to be revealed',
      });
    }

    console.log('[LetterNotifications] Permission granted');
    return true;
  } catch (error) {
    console.error('[LetterNotifications] Failed to request permissions:', error);
    return false;
  }
}

/**
 * Schedule a notification for when a letter is ready
 *
 * @param letter - The letter metadata
 * @returns Notification identifier
 */
export async function scheduleLetterNotification(
  letter: LetterMetadata
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Calculate seconds until return date
    const secondsUntilReturn = Math.max(
      0,
      Math.floor((letter.returnDate - Date.now()) / 1000)
    );

    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A letter has returned from the void',
        body: `Your ${letter.returnDays}-day letter is ready to be revealed.`,
        data: {
          type: 'letter_return',
          letterId: letter.id,
          returnDays: letter.returnDays,
        },
        sound: 'default',
        badge: 1,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReturn,
      },
    });

    console.log(
      `[LetterNotifications] Scheduled notification ${identifier} for letter ${letter.id} in ${secondsUntilReturn} seconds`
    );

    return identifier;
  } catch (error) {
    console.error('[LetterNotifications] Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 *
 * @param identifier - The notification identifier
 */
export async function cancelLetterNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`[LetterNotifications] Cancelled notification ${identifier}`);
  } catch (error) {
    console.error('[LetterNotifications] Failed to cancel notification:', error);
  }
}

/**
 * Cancel all letter notifications
 */
export async function cancelAllLetterNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const letterNotifications = scheduled.filter(
      (n) => n.content.data?.type === 'letter_return'
    );

    for (const notification of letterNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(
      `[LetterNotifications] Cancelled ${letterNotifications.length} notifications`
    );
  } catch (error) {
    console.error('[LetterNotifications] Failed to cancel all notifications:', error);
  }
}

/**
 * Get all scheduled letter notifications
 */
export async function getScheduledLetterNotifications(): Promise<
  Array<{
    identifier: string;
    letterId: string;
    returnDays: number;
    scheduledTime: Date;
  }>
> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const letterNotifications = scheduled.filter(
      (n) => n.content.data?.type === 'letter_return'
    );

    return letterNotifications.map((n) => ({
      identifier: n.identifier,
      letterId: n.content.data?.letterId as string,
      returnDays: n.content.data?.returnDays as number,
      scheduledTime: new Date((n.trigger as any).value || Date.now()),
    }));
  } catch (error) {
    console.error('[LetterNotifications] Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Add listener for notification responses (when user taps notification)
 *
 * @param callback - Function to call with the letter ID
 * @returns Subscription to remove listener
 */
export function addLetterNotificationListener(
  callback: (letterId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === 'letter_return' && data?.letterId) {
      callback(data.letterId as string);
    }
  });
}

/**
 * Add listener for received notifications (when notification arrives)
 *
 * @param callback - Function to call when letter notification received
 * @returns Subscription to remove listener
 */
export function addLetterReceivedListener(
  callback: (letterId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.type === 'letter_return' && data?.letterId) {
      callback(data.letterId as string);
    }
  });
}

/**
 * Clear the notification badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('[LetterNotifications] Failed to clear badge:', error);
  }
}

/**
 * Send an immediate test notification
 */
export async function sendTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test notification',
      body: 'Letters to the Void notifications are working!',
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}
