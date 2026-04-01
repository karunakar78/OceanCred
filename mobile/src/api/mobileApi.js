import { Platform } from 'react-native';
import Constants from 'expo-constants';

function stripTrailingSlash(value) {
    return value ? value.replace(/\/+$/, '') : value;
}

function inferExpoHost() {
    const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoClient?.hostUri ||
        Constants.manifest?.debuggerHost;

    if (!hostUri) return null;
    return hostUri.split(':')[0];
}

function buildBaseUrls() {
    const envBase = stripTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL);
    const expoHost = inferExpoHost();
    const defaults = [];

    if (envBase) defaults.push(envBase);
    if (expoHost) defaults.push(`http://${expoHost}:8080/v1`);

    if (Platform.OS === 'android') {
        defaults.push('http://10.0.2.2:8080/v1');
    }

    defaults.push('http://127.0.0.1:8080/v1');
    defaults.push('http://localhost:8080/v1');

    return Array.from(new Set(defaults.map(stripTrailingSlash).filter(Boolean)));
}

const BASE_URLS = buildBaseUrls();
let lastWorkingBaseUrl = BASE_URLS[0] || 'http://127.0.0.1:8080/v1';

async function request(path, { method = 'GET', token, body, isForm = false } = {}) {
    const headers = {};

    if (!isForm) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const candidateBaseUrls = [lastWorkingBaseUrl, ...BASE_URLS.filter((b) => b !== lastWorkingBaseUrl)];
    let response;
    let responseUrl = null;
    const networkAttempts = [];

    for (const baseUrl of candidateBaseUrls) {
        const url = `${baseUrl}${path}`;
        try {
            response = await fetch(url, {
                method,
                headers,
                body: isForm ? body : body ? JSON.stringify(body) : undefined,
            });
            responseUrl = url;
            lastWorkingBaseUrl = baseUrl;
            break;
        } catch (networkError) {
            networkAttempts.push(url);
            if (__DEV__) {
                console.log(`[API] Network fail ${method} ${url}`);
            }
        }
    }

    if (!response) {
        const error = new Error(
            `Network request failed for ${method} ${path}. Tried: ${networkAttempts.join(', ')}`
        );
        throw error;
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const message =
            payload?.error?.message ||
            payload?.detail ||
            `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        error.url = responseUrl;
        throw error;
    }

    return payload;
}

export const mobileApi = {
    baseUrl: lastWorkingBaseUrl,

    sendOtp: (phone) => request('/auth/otp/send', { method: 'POST', body: { phone } }),
    verifyOtp: (phone, otp) => request('/auth/otp/verify', { method: 'POST', body: { phone, otp } }),
    refreshToken: () => request('/auth/refresh', { method: 'POST' }),
    logout: () => request('/auth/logout', { method: 'POST' }),

    getProfile: (token) => request('/profile', { token }),
    updateProfile: (token, updates) => request('/profile', { method: 'PATCH', token, body: updates }),
    completeOnboarding: (token, payload) => request('/profile/onboarding', { method: 'POST', token, body: payload }),

    uploadWaste: ({ token, photoFile, gps_lat, gps_lng, captured_at, device_hash }) => {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('gps_lat', String(gps_lat));
        formData.append('gps_lng', String(gps_lng));
        formData.append('captured_at', captured_at);
        formData.append('device_hash', device_hash);

        return request('/upload', { method: 'POST', token, body: formData, isForm: true });
    },
    getUploads: (token) => request('/uploads', { token }),
    getUploadById: (token, uploadId) => request(`/upload/${uploadId}`, { token }),

    getWallet: (token) => request('/wallet', { token }),
    getWalletTransactions: (token) => request('/wallet/transactions', { token }),

    createListing: (token, payload) => request('/listings', { method: 'POST', token, body: payload }),
    getListings: (token) => request('/listings', { token }),
    getListingDetails: (token, listingId) => request(`/listings/${listingId}`, { token }),
    cancelListing: (token, listingId) => request(`/listings/${listingId}`, { method: 'DELETE', token }),
    acceptBid: (token, listingId, bidId) => request(`/listings/${listingId}/accept`, { method: 'POST', token, body: { bid_id: bidId } }),

    connectWs: (token) => {
        const wsBase = lastWorkingBaseUrl.replace(/^http/, 'ws').replace('/v1', '');
        return new WebSocket(`${wsBase}/v1/ws?token=${encodeURIComponent(token)}`);
    },
};
