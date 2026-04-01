import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader, StatCard } from '../components/Shared';

export default function WalletScreen({ navigate }) {
    const history = [
        { date: 'Apr 01', desc: 'Arabian Sea upload', credits: +52, kg: '4.2 kg' },
        { date: 'Mar 28', desc: 'Lakshadweep upload', credits: +48, kg: '3.8 kg' },
        { date: 'Mar 28', desc: 'Sold — Plasticorp Ltd', credits: -48, kg: null },
        { date: 'Mar 21', desc: 'Kochi Port upload', credits: +74, kg: '6.1 kg' },
        { date: 'Mar 14', desc: 'Sold — GreenSea Inc', credits: -29, kg: null },
        { date: 'Mar 14', desc: 'Calicut upload', credits: +29, kg: '2.2 kg' },
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="My Wallet" subtitle="Ocean Plastic Credits" onBack={() => navigate('result')} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>126</Text>
                        <Text style={styles.balanceUnit}>credits</Text>
                    </View>
                    <Text style={styles.balanceEst}>≈ ₹18,900 estimated value</Text>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceFooterRow}>
                        <View>
                            <Text style={styles.balFooterLabel}>Lifetime Earned</Text>
                            <Text style={styles.balFooterValue}>253 credits</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.balFooterLabel}>Lifetime Sold</Text>
                            <Text style={styles.balFooterValue}>127 credits</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <StatCard label="Plastic" value="72" unit="pts" accent={C.cyan} />
                    <StatCard label="Net/Gear" value="42" unit="pts" accent={C.teal} />
                    <StatCard label="Mixed" value="12" unit="pts" accent={C.amber} />
                </View>

                <Text style={styles.sectionTitle}>Transaction History</Text>

                {history.map((h, i) => (
                    <View key={i} style={styles.txRow}>
                        <View style={styles.historyDate}>
                            <Text style={styles.historyDateText}>{h.date}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyType}>{h.desc}</Text>
                            {h.kg && <Text style={styles.historyMeta}>{h.kg} collected</Text>}
                        </View>
                        <Text style={[styles.txAmount, { color: h.credits > 0 ? C.green : C.red }]}>
                            {h.credits > 0 ? '+' : ''}
                            {h.credits}
                        </Text>
                    </View>
                ))}

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={() => navigate('marketplace')}>
                    <Text style={styles.primaryBtnText}>List on Marketplace →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
