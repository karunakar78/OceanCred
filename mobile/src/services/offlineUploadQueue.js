/**
 * Offline capture queue — implementation outline
 * =============================================
 *
 * Goal: let fishers take a waste photo + GPS when connectivity is poor, then upload when back online.
 *
 * 1) Capture (possibly offline)
 *    - Use expo-image-picker (camera) → temporary content:// or file URI.
 *    - Read GPS: expo-location getCurrentPositionAsync; if it fails, allow last-known position
 *      with a clear "approximate" flag stored on the queued item.
 *    - Store locked cleaning area from the prior step (already in app state / AsyncStorage).
 *
 * 2) Persist queue items (AsyncStorage or a small SQLite via expo-sqlite)
 *    Each item: {
 *      id: string (uuid),
 *      createdAt: ISO string,
 *      photoUri: string (must be copied with expo-file-system.copyAsync to a permanent path under
 *                FileSystem.documentDirectory — temp URIs disappear),
 *      gps_lat, gps_lng, locked_lat, locked_lng,
 *      captured_at: ISO string,
 *      device_hash: string,
 *      syncStatus: 'pending' | 'uploading' | 'failed',
 *      lastError?: string
 *    }
 *
 * 3) Network awareness
 *    - expo-network (or @react-native-community/netinfo) — when isInternetReachable becomes true,
 *      run flushQueue().
 *    - Also flush when app returns to foreground (AppState) if online.
 *
 * 4) Sync rules (product + safety)
 *    - Max queue length (e.g. 10) and max age (e.g. 48h) — drop or require re-capture.
 *    - Skip duplicate submit: same device_hash + idempotency key in API if you add one.
 *    - If upload fails with 4xx validation, mark failed and surface in UI (do not infinite retry).
 *    - Optional: require Wi‑Fi for large photos (user setting).
 *
 * 5) UX
 *    - Profile or Upload screen: "Pending uploads (2)" with retry/discard.
 *    - After enqueue, show "Saved — will send when online".
 *
 * Next step: wire UploadScreen to enqueue when fetch to API fails with network error, and add
 * flushOfflineQueue(token) on app start when NetInfo reports online.
 */

export const OFFLINE_QUEUE_DESIGN_VERSION = 1;

/** Placeholder — implement when wiring UploadScreen + FileSystem. */
export async function getPendingOfflineCount() {
    return 0;
}

/** Placeholder */
export async function flushOfflineQueue(_token) {
    return { uploaded: 0, failed: 0 };
}
