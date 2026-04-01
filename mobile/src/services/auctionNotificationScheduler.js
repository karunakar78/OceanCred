import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_CHANNEL_ID } from './notifications';

const storageKey = (listingId) => `seacred_auction_scheduled_ids_${listingId}`;

function androidContentExtras() {
    return Platform.OS === 'android' ? { android: { channelId: ANDROID_CHANNEL_ID } } : {};
}

/**
 * Schedules local notifications for auction end (and ~1h before if there is time).
 * Cancels prior schedules for the same listing. Call when listing details load / refresh.
 */
export async function scheduleAuctionNotifications(listingId, expiresAtIso) {
    if (Platform.OS === 'web' || !listingId || !expiresAtIso) return;

    await clearAuctionNotifications(listingId);

    const expires = new Date(expiresAtIso);
    const now = Date.now();
    if (Number.isNaN(expires.getTime()) || expires.getTime() <= now) return;

    const ids = [];

    const oneHourBefore = new Date(expires.getTime() - 60 * 60 * 1000);
    if (oneHourBefore.getTime() > now) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Auction ending in 1 hour',
                body: 'SeaCred — your listing closes soon. Open the app to review bids.',
                data: { type: 'auction_end_soon', listingId },
                sound: true,
                ...androidContentExtras(),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: oneHourBefore,
            },
        });
        ids.push(id);
    }

    const idClose = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Auction window closed',
            body: 'SeaCred — your listing time has ended. Open the app to accept a bid or relist.',
            data: { type: 'auction_end', listingId },
            sound: true,
            ...androidContentExtras(),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: expires,
        },
    });
    ids.push(idClose);

    await AsyncStorage.setItem(storageKey(listingId), JSON.stringify(ids));
}

/** Cancel scheduled auction reminders (e.g. after accept, cancel, or listing cleared). */
export async function clearAuctionNotifications(listingId) {
    if (Platform.OS === 'web' || !listingId) return;

    try {
        const raw = await AsyncStorage.getItem(storageKey(listingId));
        if (!raw) return;
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
            for (const nid of ids) {
                try {
                    await Notifications.cancelScheduledNotificationAsync(nid);
                } catch {
                    /* ignore */
                }
            }
        }
    } catch {
        /* ignore */
    }
    await AsyncStorage.removeItem(storageKey(listingId));
}
