import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader } from '../components/Shared';

export default function UploadScreen({ navigate }) {
    const [captured, setCaptured] = useState(false);

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Upload Waste" subtitle="Photo + GPS + Time — tamper-proof" onBack={() => navigate('profile')} />
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
                            <TouchableOpacity style={styles.captureBtn} onPress={() => setCaptured(true)}>
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
                        { icon: '📍', label: 'GPS Location', value: '12.4°N  74.2°E', ok: true },
                        { icon: '🕐', label: 'Timestamp', value: 'Apr 01, 2026 · 09:42 AM', ok: true },
                        { icon: '📸', label: 'Photo Hash', value: 'sha256: a3f9...', ok: captured },
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
                    onPress={() => captured && navigate('result')}
                >
                    <Text style={styles.primaryBtnText}>{captured ? 'Submit for AI Verification →' : 'Take Photo First'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
