import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader } from '../components/Shared';
import { mobileApi } from '../api/mobileApi';

function toShortDate(dateIso) {
    try {
        return new Date(dateIso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    } catch {
        return 'N/A';
    }
}

export default function WalletScreen({ navigate, token }) {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!token) return;
            try {
                const [walletRes, txRes] = await Promise.all([
                    mobileApi.getWallet(token),
                    mobileApi.getWalletTransactions(token),
                ]);
                if (!mounted) return;
                setWallet(walletRes);
                setTransactions(txRes?.transactions || []);
            } catch {
                if (!mounted) return;
                setWallet(null);
                setTransactions([]);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [token]);

    const estimatedValue = useMemo(() => (wallet?.available_credits || 0) * 150, [wallet]);

    const handleRefresh = async () => {
        if (!token) return;
        setRefreshing(true);
        try {
            const [walletRes, txRes] = await Promise.all([
                mobileApi.getWallet(token),
                mobileApi.getWalletTransactions(token),
            ]);
            setWallet(walletRes);
            setTransactions(txRes?.transactions || []);
        } catch {
            setWallet(null);
            setTransactions([]);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="My Wallet" subtitle="Sea Plastic Credits" onBack={() => navigate('result')} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{wallet?.available_credits ?? 0}</Text>
                        <Text style={styles.balanceUnit}>credits</Text>
                    </View>
                    <Text style={styles.balanceEst}>≈ ₹{estimatedValue.toLocaleString('en-IN')} estimated value</Text>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceFooterRow}>
                        <View>
                            <Text style={styles.balFooterLabel}>Lifetime Earned</Text>
                            <Text style={styles.balFooterValue}>{wallet?.lifetime_earned ?? 0} credits</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.balFooterLabel}>Lifetime Sold</Text>
                            <Text style={styles.balFooterValue}>{wallet?.lifetime_sold ?? 0} credits</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Transaction History</Text>

                {transactions.map((h, i) => (
                    <View key={h.id || i} style={styles.txRow}>
                        <View style={styles.historyDate}>
                            <Text style={styles.historyDateText}>{toShortDate(h.date)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyType}>{h.description}</Text>
                            {!!h.amount_inr && <Text style={styles.historyMeta}>₹{Math.round(h.amount_inr).toLocaleString('en-IN')} payout</Text>}
                        </View>
                        <Text style={[styles.txAmount, { color: h.credits > 0 ? C.green : C.red }]}>
                            {h.credits > 0 ? '+' : ''}
                            {h.credits}
                        </Text>
                    </View>
                ))}

                {!transactions.length && (
                    <View style={styles.noticeCard}>
                        <Text style={styles.noticeIcon}>ℹ️</Text>
                        <Text style={styles.noticeText}>No wallet transactions yet.</Text>
                    </View>
                )}

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={() => navigate('marketplace')}>
                    <Text style={styles.primaryBtnText}>List on Marketplace →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
