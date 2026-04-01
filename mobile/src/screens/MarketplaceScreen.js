import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader } from '../components/Shared';

export default function MarketplaceScreen({ navigate }) {
    const [credits, setCredits] = useState('52');
    const [floor, setFloor] = useState('150');
    const [listed, setListed] = useState(false);

    const bids = [
        { company: 'Plasticorp Ltd', logo: 'PC', bid: 185, time: '2m ago', top: true },
        { company: 'GreenSea Solutions', logo: 'GS', bid: 175, time: '5m ago', top: false },
        { company: 'OceanCycle Corp', logo: 'OC', bid: 162, time: '11m ago', top: false },
        { company: 'EcoWave India', logo: 'EW', bid: 155, time: '18m ago', top: false },
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Marketplace" subtitle="Live Auction — Credits" onBack={() => navigate('wallet')} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {!listed ? (
                    <>
                        <View style={styles.listingCard}>
                            <Text style={styles.listingHeading}>List Credits for Auction</Text>

                            <Text style={styles.inputLabel}>Credits to List (max 126)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={credits}
                                onChangeText={setCredits}
                                keyboardType="numeric"
                                placeholderTextColor={C.textDim}
                            />

                            <Text style={styles.inputLabel}>Minimum Bid Price (₹ per credit)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={floor}
                                onChangeText={setFloor}
                                keyboardType="numeric"
                                placeholderTextColor={C.textDim}
                            />

                            <View style={styles.estimateRow}>
                                <Text style={styles.estimateLabel}>Estimated Minimum Earn</Text>
                                <Text style={styles.estimateValue}>
                                    ₹{(parseInt(credits || 0) * parseInt(floor || 0)).toLocaleString('en-IN')}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={() => setListed(true)}>
                                <Text style={styles.primaryBtnText}>Start Auction →</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.marketInfoCard}>
                            <Text style={styles.marketInfoTitle}>Current Market Rate</Text>
                            <Text style={styles.marketInfoValue}>₹178 / credit</Text>
                            <Text style={styles.marketInfoSub}>7-day average · Arabian Sea region</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.auctionHeader}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE AUCTION</Text>
                            <Text style={styles.auctionTimer}>00:47:22 remaining</Text>
                        </View>

                        <View style={styles.auctionInfo}>
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Listed</Text>
                                <Text style={styles.auctionInfoValue}>{credits} credits</Text>
                            </View>
                            <View style={styles.auctionInfoDivider} />
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Floor</Text>
                                <Text style={styles.auctionInfoValue}>₹{floor}/cr</Text>
                            </View>
                            <View style={styles.auctionInfoDivider} />
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Top Bid</Text>
                                <Text style={[styles.auctionInfoValue, { color: C.green }]}>₹185/cr</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Live Bids</Text>

                        {bids.map((b, i) => (
                            <View key={i} style={[styles.bidRow, b.top && styles.bidRowTop]}>
                                <View style={[styles.companyLogo, b.top && { borderColor: C.amber }]}>
                                    <Text style={styles.companyLogoText}>{b.logo}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.companyName}>{b.company}</Text>
                                    <Text style={styles.bidTime}>{b.time}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.bidAmount, b.top && { color: C.amber }]}>₹{b.bid}/cr</Text>
                                    <Text style={styles.bidTotal}>₹{(b.bid * parseInt(credits)).toLocaleString('en-IN')}</Text>
                                </View>
                                {b.top && (
                                    <View style={styles.topBadge}>
                                        <Text style={styles.topBadgeText}>TOP</Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity style={[styles.primaryBtn, styles.acceptBtn]}>
                            <Text style={styles.primaryBtnText}>
                                ✓  Accept Top Bid — ₹{(185 * parseInt(credits)).toLocaleString('en-IN')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setListed(false)}>
                            <Text style={styles.secondaryBtnText}>Cancel Auction</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
