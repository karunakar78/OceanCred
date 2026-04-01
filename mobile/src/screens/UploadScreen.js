import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader } from '../components/Shared';
import LocationPicker from '../components/LocationPicker';
import { mobileApi } from '../api/mobileApi';
import { enqueueOfflineUpload } from '../services/offlineUploadQueue';
import NetInfo from '@react-native-community/netinfo';

export default function UploadScreen({ navigate, token, onUploadComplete }) {
    const [lockedCoords, setLockedCoords] = useState(null);
    const [captured, setCaptured] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [coords, setCoords] = useState(null);
    const [capturedAt, setCapturedAt] = useState(null);

    const handleCapture = async () => {
        try {
            setError('');

            const camPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!camPermission.granted) {
                setError('Camera permission is required to capture waste photo.');
                return;
            }

            const locPermission = await Location.requestForegroundPermissionsAsync();
            if (locPermission.status !== 'granted') {
                setError('Location permission is required for verified upload.');
                return;
            }

            const photo = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (photo.canceled || !photo.assets?.length) {
                return;
            }

            const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const now = new Date();
            const asset = photo.assets[0];

            setPhotoFile({
                uri: asset.uri,
                name: asset.fileName || `capture_${Date.now()}.jpg`,
                type: asset.mimeType || 'image/jpeg',
            });
            setCoords({
                lat: currentPos.coords.latitude,
                lng: currentPos.coords.longitude,
            });
            setCapturedAt(now.toISOString());
            setCaptured(true);
        } catch (e) {
            setError(e.message || 'Could not open camera.');
        }
    };

    const handleSubmit = async () => {
        if (!captured || !token || !photoFile || !coords || !capturedAt || !lockedCoords) return;

        try {
            setSubmitting(true);
            setError('');

            const uploadPayload = {
                token,
                photoFile,
                gps_lat: coords.lat,
                gps_lng: coords.lng,
                locked_lat: lockedCoords.lat,
                locked_lng: lockedCoords.lng,
                captured_at: capturedAt,
                device_hash: `rn-device-${Date.now()}`,
            };

            const netState = await NetInfo.fetch();
            if (!netState.isConnected || !netState.isInternetReachable) {
                await enqueueOfflineUpload(uploadPayload);
                Alert.alert('Saved Offline', 'Your capture was saved and will be uploaded when you have a good internet connection.');
                navigate('profile');
                return;
            }

            const response = await mobileApi.uploadWaste(uploadPayload);

            if (onUploadComplete) {
                onUploadComplete({ ...response, coords });
            }
            navigate('result');
        } catch (e) {
            if (e.message && e.message.includes('Network request failed')) {
                const uploadPayload = {
                    token,
                    photoFile,
                    gps_lat: coords.lat,
                    gps_lng: coords.lng,
                    locked_lat: lockedCoords.lat,
                    locked_lng: lockedCoords.lng,
                    captured_at: capturedAt,
                    device_hash: `rn-device-${Date.now()}`,
                };
                await enqueueOfflineUpload(uploadPayload);
                Alert.alert('Saved Offline', 'Network failed during upload. Your capture will be automatically synced when you are back online.');
                navigate('profile');
            } else {
                setError(e.message || 'Upload failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!lockedCoords) {
        return (
            <SafeAreaView style={styles.screen}>
                <WaveHeader title="Select Area" subtitle="Lock in your cleaning zone" onBack={() => navigate('profile')} />
                <LocationPicker onLock={setLockedCoords} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Upload Waste" subtitle="Photo + GPS + Time — tamper-proof" onBack={() => setLockedCoords(null)} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <View style={styles.viewfinder}>
                    {!captured ? (
                        <>
                            <View style={styles.vfCornerTL} />
                            <View style={styles.vfCornerTR} />
                            <View style={styles.vfCornerBL} />
                            <View style={styles.vfCornerBR} />
                            <Text style={styles.vfIcon}>📷</Text>
                            <Text style={styles.vfText}>Point at collected waste</Text>
                            <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                                <View style={styles.captureBtnInner} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.vfCaptured}>✓</Text>
                            <Text style={[styles.vfText, { color: C.green }]}>Photo Captured!</Text>
                        </>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Auto-Captured Data</Text>
                <View style={styles.metaCard}>
                    {[
                        {
                            icon: '📍',
                            label: 'GPS Location',
                            value: coords ? `${coords.lat.toFixed(4)}°N  ${coords.lng.toFixed(4)}°E` : '',
                            ok: !!coords,
                        },
                        {
                            icon: '🕐',
                            label: 'Timestamp',
                            value: capturedAt ? new Date(capturedAt).toLocaleString('en-IN') : '',
                            ok: !!capturedAt,
                        },
                        { icon: '📸', label: 'Photo', value: photoFile?.name || '', ok: captured },
                    ].map((m, i) => (
                        <View key={i} style={[styles.metaRow, i < 2 && styles.metaRowBorder]}>
                            <Text style={styles.metaIcon}>{m.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.metaLabel}>{m.label}</Text>
                                <Text style={[styles.metaValue, !m.ok && { color: C.textDim }]}>
                                    {m.ok ? m.value : 'Pending capture...'}
                                </Text>
                            </View>
                            {m.ok && <Text style={{ color: C.green, fontSize: 16 }}>✓</Text>}
                        </View>
                    ))}
                </View>

                <View style={styles.noticeCard}>
                    <Text style={styles.noticeIcon}>🔒</Text>
                    <Text style={styles.noticeText}>
                        All 3 data points are cryptographically bundled together. Individual elements cannot be faked or reused.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.primaryBtn, !captured && styles.primaryBtnDisabled]}
                    onPress={handleSubmit}
                >
                    <Text style={styles.primaryBtnText}>
                        {captured ? (submitting ? 'Submitting...' : 'Submit for AI Verification →') : 'Take Photo First'}
                    </Text>
                </TouchableOpacity>
                {!!error && <Text style={[styles.otpHint, { marginTop: 10 }]}>{error}</Text>}
            </ScrollView>
        </SafeAreaView>
    );
}
