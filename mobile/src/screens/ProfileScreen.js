import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader, Tag, StatCard } from '../components/Shared';

export default function ProfileScreen({ navigate }) {
    const uploads = [
        { date: 'Mar 28', type: 'Plastic Bottles + Net', kg: '3.8 kg', credits: 48, status: 'sold' },
        { date: 'Mar 21', type: 'Fishing Gear Debris', kg: '6.1 kg', credits: 74, status: 'listed' },
        { date: 'Mar 14', type: 'Mixed Plastic', kg: '2.2 kg', credits: 29, status: 'sold' },
        { date: 'Mar 07', type: 'Ghost Net Fragment', kg: '8.4 kg', credits: 102, status: 'sold' },
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="My Profile" subtitle="Rajan Pillai · Kerala Coast" />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarRing}>
                        <Text style={styles.avatarText}>RP</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.profileName}>Rajan Pillai</Text>
                        <Text style={styles.profileSub}>📍 Thiruvananthapuram, Kerala</Text>
                        <Tag label="Verified Fisherman ✓" color={C.green} />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <StatCard label="Total Credits" value="253" unit="pts" accent={C.cyan} />
                    <StatCard label="Waste Collected" value="20.5" unit="kg" accent={C.teal} />
                    <StatCard label="Earnings" value="₹1.2L" unit="" accent={C.amber} />
                </View>

                <Text style={styles.sectionTitle}>Upload History</Text>

                {uploads.map((u, i) => (
                    <View key={i} style={styles.historyRow}>
                        <View style={styles.historyDate}>
                            <Text style={styles.historyDateText}>{u.date}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyType}>{u.type}</Text>
                            <Text style={styles.historyMeta}>{u.kg} · {u.credits} credits</Text>
                        </View>
                        <View
                            style={[
                                styles.statusPill,
                                { backgroundColor: u.status === 'sold' ? C.green + '20' : C.amber + '20' },
                            ]}
                        >
                            <Text style={[styles.statusText, { color: u.status === 'sold' ? C.green : C.amber }]}>
                                {u.status === 'sold' ? 'Sold' : 'Listed'}
                            </Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('upload')}>
                    <Text style={styles.primaryBtnText}>📷  Upload New Waste →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
