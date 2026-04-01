import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { mobileApi } from '../api/mobileApi';

/**
 * Registers device with Expo Push and saves token on the user so the backend can
 * notify when a company places a bid (works in background / app killed).
 */
export async function registerExpoPushTokenForUser(accessToken) {
    if (!accessToken || Platform.OS === 'web') return;

    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const tokenRes = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
        );
        const expoPushToken = tokenRes?.data;
        if (!expoPushToken) return;

        await mobileApi.updateProfile(accessToken, { expo_push_token: expoPushToken });
    } catch (e) {
        if (__DEV__) {
            console.log('[push] registerExpoPushTokenForUser:', e?.message);
        }
    }
}
