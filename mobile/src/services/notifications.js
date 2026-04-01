import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Shows alerts in the system tray (including while the app is foregrounded). */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const ANDROID_CHANNEL_ID = 'seacred-default';

/**
 * Android channel + permission prompt. Call once after login.
 * Remote push is not required — local + scheduled notifications use the same channel.
 */
export async function ensureNotificationSetup() {
    if (Platform.OS === 'web') return;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
            name: 'SeaCred',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#22d3ee',
            sound: 'default',
        });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
        await Notifications.requestPermissionsAsync();
    }
}

/**
 * Immediate local notification (appears in the notification panel).
 */
export async function notifyLocal({ title, body, data = {} }) {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
            ...(Platform.OS === 'android' && {
                android: { channelId: ANDROID_CHANNEL_ID },
            }),
        },
        trigger: null,
    });
}
