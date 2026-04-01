import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { mobileApi } from '../api/mobileApi';
import { notifyLocal } from './notifications';

const SNAPSHOT_KEY = 'seacred_marketplace_notif_snapshot_v2';
/** Poll while the app is in foreground (backup if push is unavailable). */
const POLL_MS = 5000;

export async function clearMarketplaceNotificationSnapshot() {
    try {
        await AsyncStorage.removeItem(SNAPSHOT_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Mobile-only delivery: compares API state on an interval and fires *local* notifications.
 * No push server — works while the app can reach the API (foreground/background with JS running).
 * For alerts while the app is fully killed, you would add Expo push + backend later.
 */
export function startMarketplaceNotificationsPoller(token) {
    if (Platform.OS === 'web' || !token) {
        return () => {};
    }

    let cancelled = false;
    let timer = null;

    const tick = async () => {
        if (cancelled) return;
        let prev = null;
        try {
            const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
            prev = raw ? JSON.parse(raw) : null;
        } catch {
            prev = null;
        }

        try {
            const [listingsRes, txRes] = await Promise.all([
                mobileApi.getListings(token),
                mobileApi.getWalletTransactions(token),
            ]);

            const listings = listingsRes?.listings || [];
            const active = listings.find((l) => l.status === 'active');

            const txs = txRes?.transactions || [];
            const topTx = txs[0];
            const bidSignature =
                active && active.listing_id
                    ? await (async () => {
                          try {
                              const details = await mobileApi.getListingDetails(token, active.listing_id);
                              const bids = details?.bids || [];
                              const top = bids[0];
                              return `${bids.length}:${top?.bid_id || 'none'}:${top?.total_inr ?? 'x'}`;
                          } catch {
                              return null;
                          }
                      })()
                    : null;

            const snapshot = {
                activeListingId: active?.listing_id || null,
                bidSignature,
                topTxId: topTx?.id || null,
            };

            // New bids: server sends Expo Push (see backend place_bid). Polling here would duplicate alerts.

            // Listing was active; same id now cancelled (or no longer active and row is cancelled)
            const wasActiveId = prev?.activeListingId;
            if (wasActiveId && (!active || active.listing_id !== wasActiveId)) {
                const row = listings.find((l) => l.listing_id === wasActiveId);
                if (row?.status === 'cancelled') {
                    await notifyLocal({
                        title: 'Listing cancelled',
                        body: 'Your auction listing was cancelled. Credits return to your wallet.',
                        data: { type: 'listing_cancelled' },
                    });
                }
            }

            // New wallet activity — payout / sale lines
            if (prev?.topTxId && topTx?.id && topTx.id !== prev.topTxId) {
                const desc = String(topTx.description || '');
                const inr = topTx.amount_inr != null ? Math.round(topTx.amount_inr) : null;
                if (desc.includes('Sold') || desc.includes('Sold Listing')) {
                    await notifyLocal({
                        title: 'Payout recorded',
                        body:
                            inr != null
                                ? `₹${inr.toLocaleString('en-IN')} — check your wallet history for details.`
                                : 'A sale was recorded. Check your wallet history.',
                        data: { type: 'payout_settled' },
                    });
                }
            }

            await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
        } catch (e) {
            if (__DEV__) {
                console.log('[marketplaceNotificationsPoller]', e?.message);
            }
        }
    };

    tick();
    timer = setInterval(tick, POLL_MS);

    const appSub = AppState.addEventListener('change', (next) => {
        if (next === 'active' && !cancelled) {
            tick();
        }
    });

    return () => {
        cancelled = true;
        if (timer) clearInterval(timer);
        appSub.remove();
    };
}
