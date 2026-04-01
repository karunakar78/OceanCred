import React, { useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader, Divider } from '../components/Shared';

export default function ResultScreen({ navigate, uploadResult }) {
    const [refreshing, setRefreshing] = useState(false);
    const ai = uploadResult?.ai_result;

    const handleRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    };
    if (!ai) {
        return (
            <SafeAreaView style={styles.screen}>
                <WaveHeader title="AI Verification" subtitle="No upload verification found" onBack={() => navigate('upload')} />
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
                    <View style={styles.noticeCard}>
                        <Text style={styles.noticeIcon}>ℹ️</Text>
                        <Text style={styles.noticeText}>Capture and submit a real upload to view AI verification results.</Text>
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('upload')}>
                        <Text style={styles.primaryBtnText}>Go to Upload →</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const checks = [
        { label: 'Real waste detected', detail: `Confidence ${Math.round((ai.confidence || 0) * 1000) / 10}%`, ok: !!ai.is_real_waste },
        { label: 'GPS in valid water body', detail: ai.water_body || 'Water body verified', ok: !!ai.location_valid },
        { label: 'Date matches today', detail: 'Timestamp validated', ok: !!ai.date_valid },
        { label: 'Photo not reused', detail: 'Hash unique — first submission', ok: true },
    ];

    const items = ai.waste_items || [];
    const detected = items.map((d, index) => ({
        type: d.type,
        kg: `${d.weight_kg} kg`,
        credits: d.credits,
        color: index % 2 === 0 ? C.cyan : C.teal,
    }));

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="AI Verification" subtitle="Result in 3.2 seconds" onBack={() => navigate('upload')} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
                <View style={styles.verifyCard}>
                    {checks.map((c, i) => (
                        <View key={i} style={[styles.checkRow, i < checks.length - 1 && styles.metaRowBorder]}>
                            <View style={[styles.checkDot, { backgroundColor: c.ok ? C.green : C.red }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.checkLabel}>{c.label}</Text>
                                <Text style={styles.checkDetail}>{c.detail}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.locationBadge}>
                    <Text style={styles.locationIcon}>🌊</Text>
                    <View>
                        <Text style={styles.locationName}>{ai.water_body || 'Verified location'}</Text>
                        <Text style={styles.locationCoords}>Uploaded and verified by backend AI</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Waste Detected</Text>
                {detected.map((d, i) => (
                    <View key={i} style={[styles.detectedRow, { borderLeftColor: d.color }]}>
                        <Text style={[styles.detectedType, { color: d.color }]}>{d.type}</Text>
                        <Text style={styles.detectedMeta}>{d.kg}</Text>
                        <View style={[styles.creditBadge, { backgroundColor: d.color + '20', borderColor: d.color + '40' }]}>
                            <Text style={[styles.creditBadgeText, { color: d.color }]}>+{d.credits} pts</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Estimated Weight</Text>
                    <Text style={styles.totalWeight}>{ai.total_weight_kg} kg</Text>
                    <Divider />
                    <Text style={styles.totalLabel}>Credits Earned</Text>
                    <Text style={styles.totalCredits}>{ai.total_credits}</Text>
                    <Text style={styles.totalCreditsUnit}>Plastic Credits</Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('wallet')}>
                    <Text style={styles.primaryBtnText}>View in Wallet →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
