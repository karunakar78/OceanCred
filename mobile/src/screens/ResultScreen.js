import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader, Divider } from '../components/Shared';

export default function ResultScreen({ navigate }) {
    const checks = [
        { label: 'Real waste detected', detail: 'Confidence 97.3%', ok: true },
        { label: 'GPS in valid water body', detail: 'Arabian Sea — verified', ok: true },
        { label: 'Date matches today', detail: 'Apr 01, 2026 — confirmed', ok: true },
        { label: 'Photo not reused', detail: 'Hash unique — first submission', ok: true },
    ];

    const detected = [
        { type: 'Plastic Bottles', kg: '2.1 kg', credits: 28, color: C.cyan },
        { type: 'Fishing Net', kg: '2.1 kg', credits: 24, color: C.teal },
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="AI Verification" subtitle="Result in 3.2 seconds" onBack={() => navigate('upload')} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
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
                        <Text style={styles.locationName}>Arabian Sea</Text>
                        <Text style={styles.locationCoords}>12.4°N  74.2°E · Apr 01, 2026</Text>
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
                    <Text style={styles.totalWeight}>4.2 kg</Text>
                    <Divider />
                    <Text style={styles.totalLabel}>Credits Earned</Text>
                    <Text style={styles.totalCredits}>52</Text>
                    <Text style={styles.totalCreditsUnit}>Plastic Credits</Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('wallet')}>
                    <Text style={styles.primaryBtnText}>View in Wallet →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
