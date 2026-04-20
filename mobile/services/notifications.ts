import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Handler: how notifications are presented when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permissions + obtain Expo push token, then register it with backend.
 * Must be called after login.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Must use a physical device for push notifications');
    return null;
  }

  // Android channel (required to receive push)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications Beauté du Cil',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8586E',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permission not granted');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] No EAS project ID configured');
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    await api.auth.registerPushToken(
      token,
      Platform.OS === 'ios' ? 'ios' : 'android'
    );
    return token;
  } catch (e) {
    console.error('[push] Failed to register:', e);
    return null;
  }
}

/**
 * Listen to notifications while app is running and when user taps them.
 */
export function addNotificationListeners(handlers: {
  onReceived?: (n: Notifications.Notification) => void;
  onTapped?: (r: Notifications.NotificationResponse) => void;
}) {
  const receivedSub = handlers.onReceived
    ? Notifications.addNotificationReceivedListener(handlers.onReceived)
    : null;
  const tappedSub = handlers.onTapped
    ? Notifications.addNotificationResponseReceivedListener(handlers.onTapped)
    : null;
  return () => {
    receivedSub?.remove();
    tappedSub?.remove();
  };
}
