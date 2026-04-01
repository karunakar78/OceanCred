import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, View, Text, TouchableOpacity, Modal } from 'react-native';
import * as Location from 'expo-location';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader, Tag, StatCard } from '../components/Shared';
import { mobileApi } from '../api/mobileApi';

function formatShortDate(dateIso) {
    try {
        const d = new Date(dateIso);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    } catch {
        return 'N/A';
    }
}

export default function ProfileScreen({ navigate, token, user, onLogout }) {
    const [profile, setProfile] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [locationMessage, setLocationMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUpload, setSelectedUpload] = useState(null);
    const [unlistLoading, setUnlistLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!token) return;
            try {
                const [profileRes, uploadsRes] = await Promise.all([
                    mobileApi.getProfile(token),
                    mobileApi.getUploads(token),
                ]);
                if (!mounted) return;
                setProfile(profileRes);
                setUploads(uploadsRes?.uploads || []);
            } catch {
                if (!mounted) return;
                setProfile(null);
                setUploads([]);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [token]);

    useEffect(() => {
        let mounted = true;

        const syncLocation = async () => {
            if (!token) return;
            try {
                const permission = await Location.requestForegroundPermissionsAsync();
                if (permission.status !== 'granted') {
                    if (mounted) setLocationMessage('Location permission denied.');
                    return;
                }

                const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const coords = `${current.coords.latitude.toFixed(4)}, ${current.coords.longitude.toFixed(4)}`;

                await mobileApi.updateProfile(token, { location: coords });
                const refreshed = await mobileApi.getProfile(token);
                if (!mounted) return;
                setProfile(refreshed);
                setLocationMessage('Location synced from device GPS.');
            } catch {
                if (mounted) setLocationMessage('Could not fetch device location.');
            }
        };

        syncLocation();
        return () => {
            mounted = false;
        };
    }, [token]);

    const displayName = profile?.name || user?.name || 'Fisherman';
    const displayLocation = profile?.location || user?.location || 'Kerala Coast';
    const initials = useMemo(() => {
        const names = displayName.split(' ').filter(Boolean);
        return (names[0]?.[0] || 'F') + (names[1]?.[0] || names[0]?.[1] || 'I');
    }, [displayName]);

    const stats = profile?.stats || {
        total_credits: 253,
        total_waste_kg: 20.5,
        lifetime_earnings_inr: 120000,
    };

    const handleRefresh = async () => {
        if (!token) return;
        setRefreshing(true);
        try {
            const [profileRes, uploadsRes] = await Promise.all([
                mobileApi.getProfile(token),
                mobileApi.getUploads(token),
            ]);
            setProfile(profileRes);
            setUploads(uploadsRes?.uploads || []);
        } catch {
            setProfile(null);
            setUploads([]);
        } finally {
            setRefreshing(false);
        }
    };

    const handleUnlist = async () => {
        if (!token || !selectedUpload?.listing_id) return;
        try {
            setUnlistLoading(true);
            await mobileApi.cancelListing(token, selectedUpload.listing_id);
            // Refresh uploads after unlisting
            const uploadsRes = await mobileApi.getUploads(token);
            setUploads(uploadsRes?.uploads || []);
            setSelectedUpload(null);
        } catch (e) {
            console.log('Unlist error:', e.message);
        } finally {
            setUnlistLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Profile" subtitle={`${displayName} · ${displayLocation}`} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarRing}>
                        <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileSub}>📍 {displayLocation}</Text>
                        <Tag label="Verified Fisherman ✓" color={C.green} />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <StatCard label="Total Credits" value={String(stats.total_credits || 0)} unit="pts" accent={C.cyan} />
                    <StatCard label="Waste Collected" value={String(Number(stats.total_waste_kg || 0).toFixed(1))} unit="kg" accent={C.teal} />
                    <StatCard
                        label="Earnings"
                        value={`₹${Math.round((stats.lifetime_earnings_inr || 0) / 1000)}K`}
                        unit=""
                        accent={C.amber}
                    />
                </View>

                <Text style={styles.sectionTitle}>Upload History</Text>

                {uploads.map((u, i) => (
                    <TouchableOpacity
                        key={u.upload_id || i}
                        style={styles.historyRow}
                        onPress={() => setSelectedUpload(u)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.historyDate}>
                            <Text style={styles.historyDateText}>{formatShortDate(u.date)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyType}>{u.waste_summary}</Text>
                            <Text style={styles.historyMeta}>{u.weight_kg} kg · {u.credits} credits</Text>
                        </View>
                        <View
                            style={[
                                styles.statusPill,
                                {
                                    backgroundColor:
                                        u.status === 'sold'
                                            ? C.green + '20'
                                            : u.status === 'cancelled'
                                                ? C.red + '20'
                                                : u.status === 'active' || u.status === 'pending' || u.status === 'listed'
                                                    ? C.amber + '20'
                                                    : C.cyan + '20',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    {
                                        color:
                                            u.status === 'sold'
                                                ? C.green
                                                : u.status === 'cancelled'
                                                    ? C.red
                                                    : u.status === 'active' || u.status === 'pending' || u.status === 'listed'
                                                        ? C.amber
                                                        : C.cyan,
                                    },
                                ]}
                            >
                                {u.status === 'sold'
                                    ? 'Sold'
                                    : u.status === 'cancelled'
                                        ? 'Cancelled'
                                        : u.status === 'active' || u.status === 'pending' || u.status === 'listed'
                                            ? 'Listed'
                                            : 'Verified'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('upload')}>
                    <Text style={styles.primaryBtnText}>📷  Upload New Waste →</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={onLogout}>
                    <Text style={styles.secondaryBtnText}>Logout</Text>
                </TouchableOpacity>

                {!!locationMessage && <Text style={[styles.otpHint, { marginTop: 10, textAlign: 'center' }]}>{locationMessage}</Text>}
            </ScrollView>

            <Modal
                visible={!!selectedUpload}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedUpload(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
                    <View style={[styles.modalContent, { borderRadius: 24, margin: 16 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.modalTitle}>Upload Details</Text>
                            <TouchableOpacity onPress={() => setSelectedUpload(null)}>
                                <Text style={{ fontSize: 24, color: C.textPri }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedUpload && (
                            <>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Waste Type</Text>
                                    <Text style={styles.modalValue}>{selectedUpload.waste_summary}</Text>
                                </View>

                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Weight</Text>
                                    <Text style={styles.modalValue}>{selectedUpload.weight_kg} kg</Text>
                                </View>

                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Credits Earned</Text>
                                    <Text style={styles.modalValue}>{selectedUpload.credits} pts</Text>
                                </View>

                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Status</Text>
                                    <View style={[
                                        styles.statusPill,
                                        {
                                            backgroundColor:
                                                selectedUpload.status === 'sold'
                                                    ? C.green + '20'
                                                    : selectedUpload.status === 'cancelled'
                                                        ? C.red + '20'
                                                        : selectedUpload.status === 'active' || selectedUpload.status === 'pending' || selectedUpload.status === 'listed'
                                                            ? C.amber + '20'
                                                            : C.cyan + '20',
                                        },
                                    ]}>
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color:
                                                        selectedUpload.status === 'sold'
                                                            ? C.green
                                                            : selectedUpload.status === 'cancelled'
                                                                ? C.red
                                                                : selectedUpload.status === 'active' || selectedUpload.status === 'pending' || selectedUpload.status === 'listed'
                                                                    ? C.amber
                                                                    : C.cyan,
                                                },
                                            ]}
                                        >
                                            {selectedUpload.status === 'sold'
                                                ? 'Sold'
                                                : selectedUpload.status === 'cancelled'
                                                    ? 'Cancelled'
                                                    : selectedUpload.status === 'active' || selectedUpload.status === 'pending' || selectedUpload.status === 'listed'
                                                        ? 'Listed'
                                                        : 'Verified'}
                                        </Text>
                                    </View>
                                </View>

                                {(selectedUpload.status === 'listed' || selectedUpload.status === 'active' || selectedUpload.status === 'pending') && selectedUpload.listing_id && (
                                    <TouchableOpacity
                                        style={[styles.dangerBtn, { marginTop: 20 }]}
                                        onPress={handleUnlist}
                                        disabled={unlistLoading}
                                    >
                                        <Text style={styles.dangerBtnText}>
                                            {unlistLoading ? 'Unlisting...' : '× Unlist This Credit'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryBtn, { marginTop: 12 }]}
                            onPress={() => setSelectedUpload(null)}
                        >
                            <Text style={styles.primaryBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
