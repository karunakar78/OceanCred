import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { mobileApi } from '../api/mobileApi';

const QUEUE_KEY = '@offline_upload_queue';

export const OFFLINE_QUEUE_DESIGN_VERSION = 2;

/**
 * Gets the current queue items.
 */
async function getQueue() {
    try {
        const data = await AsyncStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Saves a new item to the queue.
 */
export async function enqueueOfflineUpload(uploadData) {
    try {
        const queue = await getQueue();

        // 1. Copy image to durable storage
        const fileName = uploadData.photoFile.name || `offline_${Date.now()}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
            from: uploadData.photoFile.uri,
            to: newUri,
        });

        const newUploadData = {
            ...uploadData,
            photoFile: {
                ...uploadData.photoFile,
                uri: newUri,
                name: fileName,
            },
        };

        const newItem = {
            id: `offline_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            status: 'pending',
            data: newUploadData,
        };

        queue.push(newItem);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        return newItem.id;
    } catch (error) {
        console.error('Error enqueuing offline upload:', error);
        throw error;
    }
}

/**
 * Gets the number of pending uploads to show in the UI.
 */
export async function getPendingOfflineCount() {
    const queue = await getQueue();
    return queue.length;
}

/**
 * Iterates through pending queue and uploads them.
 */
let isFlushing = false;

export async function flushOfflineQueue(token) {
    if (!token || isFlushing) return { uploaded: 0, failed: 0 };
    isFlushing = true;
    
    let uploaded = 0;
    let failed = 0;

    try {
        const state = await NetInfo.fetch();
        if (!state.isConnected || !state.isInternetReachable) {
            return { uploaded, failed };
        }

        let queue = await getQueue();
        if (queue.length === 0) {
            return { uploaded, failed };
        }

        const remainingQueue = [];

        for (const item of queue) {
            try {
                // Check if file exists
                const fileInfo = await FileSystem.getInfoAsync(item.data.photoFile.uri);
                if (!fileInfo.exists) {
                    console.warn(`File for offline upload ${item.id} not found.`);
                    continue; // drop from queue
                }

                // Append the updated token
                const payload = {
                    ...item.data,
                    token,
                };

                await mobileApi.uploadWaste(payload);
                
                // Cleanup file
                await FileSystem.deleteAsync(item.data.photoFile.uri, { idempotent: true });
                uploaded++;
            } catch (error) {
                console.error(`Failed to upload ${item.id}:`, error);
                
                // Keep in queue if it's a network retryable error.
                // For simplicity, we keep it in queue if the upload fails unless it's a validation error that won't succeed.
                // Assuming any error from fetch might be retryable.
                if (error.status && error.status >= 400 && error.status < 500 && error.status !== 401) {
                    // validation error, drop it mostly (except 401 unauth which shouldn't happen here but token might have expired)
                    // You might want to log this item as permanently failed.
                    // For now, dropping 4xx errors
                    await FileSystem.deleteAsync(item.data.photoFile.uri, { idempotent: true });
                } else {
                    // network or 500 error, keep in queue
                    remainingQueue.push({ ...item, lastError: error.message, retryCount: (item.retryCount || 0) + 1 });
                    failed++;
                }
            }
        }

        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    } finally {
        isFlushing = false;
    }

    return { uploaded, failed };
}
