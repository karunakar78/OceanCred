import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { WaveHeader } from '../components/Shared';
import { mobileApi } from '../api/mobileApi';

export default function MarketplaceScreen({ navigate, token }) {
    const [credits, setCredits] = useState('');
    const [floor, setFloor] = useState('');
    const [durationHours, setDurationHours] = useState('24');
    const [listed, setListed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hint, setHint] = useState('');
    const [listingId, setListingId] = useState(null);
    const [listingDetails, setListingDetails] = useState(null);
    const [walletCredits, setWalletCredits] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const lastScheduledListingRef = useRef(null);

    useEffect(() => {
        let ws = null;
        if (token) {
            ws = mobileApi.connectWs(token);
            ws.onmessage = () => null;
        }
        return () => {
            if (ws) ws.close();
        };
    }, [token]);

    useEffect(() => {
        let mounted = true;

        const loadListings = async () => {
            if (!token) return;
            try {
                const res = await mobileApi.getListings(token);
                const wallet = await mobileApi.getWallet(token);
                setWalletCredits(wallet?.available_credits || 0);
                if (!mounted) return;
                const active = (res?.listings || []).find((l) => l.status === 'active');
                if (active) {
                    setListingId(active.listing_id);
                    setCredits(String(active.credits));
                    setFloor(String(active.floor_price_inr));
                    const closeAt = new Date(active.expires_at);
                    const hoursLeft = Math.max(1, Math.round((closeAt.getTime() - Date.now()) / (1000 * 60 * 60)));
                    setDurationHours(String(hoursLeft));
                    setListed(true);
                    const details = await mobileApi.getListingDetails(token, active.listing_id);
                    if (!mounted) return;
                    setListingDetails(details);
                }
            } catch {
                if (!mounted) return;
                setListingDetails(null);
            }
        };

        loadListings();
        return () => {
            mounted = false;
        };
    }, [token]);


    const bids = useMemo(() => {
        const mapped = (listingDetails?.bids || []).map((b, i) => ({
            company: b.company,
            logo: (b.company || 'CO').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
            bid: Math.round(b.total_inr),
            perCredit: Math.round(b.price_per_credit),
            total: Math.round(b.total_inr),
            payout: Math.round(b.payout_inr),
            time: new Date(b.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            bidId: b.bid_id,
            top: i === 0,
        }));
        return mapped;
    }, [listingDetails, credits]);

    const handleStartAuction = async () => {
        if (!token) return;
        if (!credits || !floor || !durationHours) {
            setHint('Enter credits, total price, and closing time.');
            return;
        }

        const parsedDuration = parseInt(durationHours, 10);
        if (Number.isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 168) {
            setHint('Closing time must be between 1 and 168 hours.');
            return;
        }
        try {
            setLoading(true);
            setHint('');
            const created = await mobileApi.createListing(token, {
                credits: parseInt(credits || 0, 10),
                floor_price_inr: parseFloat(floor || 0),
                duration_hours: parsedDuration,
            });
            setListingId(created.listing_id);
            setListed(true);
            const details = await mobileApi.getListingDetails(token, created.listing_id);
            setListingDetails(details);
        } catch (e) {
            setHint(e.message || 'Could not create listing.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!token || !listingId) {
            setListed(false);
            return;
        }
        try {
            setLoading(true);
            await mobileApi.cancelListing(token, listingId);
            lastScheduledListingRef.current = null;
            setListed(false);
            setListingDetails(null);
            setListingId(null);
        } catch (e) {
            setHint(e.message || 'Could not cancel listing.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTopBid = async () => {
        if (!token || !listingId || !bids[0]) return;
        try {
            setLoading(true);
            await mobileApi.acceptBid(token, listingId, bids[0].bidId);
            lastScheduledListingRef.current = null;
            setHint('Top bid accepted successfully.');
            setListed(false);
            setListingDetails(null);
            setListingId(null);
        } catch (e) {
            setHint(e.message || 'Could not accept bid.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!token) return;
        setRefreshing(true);
        try {
            const res = await mobileApi.getListings(token);
            const wallet = await mobileApi.getWallet(token);
            setWalletCredits(wallet?.available_credits || 0);
            const active = (res?.listings || []).find((l) => l.status === 'active');
            if (active) {
                setListingId(active.listing_id);
                setCredits(String(active.credits));
                setFloor(String(active.floor_price_inr));
                const closeAt = new Date(active.expires_at);
                const hoursLeft = Math.max(1, Math.round((closeAt.getTime() - Date.now()) / (1000 * 60 * 60)));
                setDurationHours(String(hoursLeft));
                setListed(true);
                const details = await mobileApi.getListingDetails(token, active.listing_id);
                setListingDetails(details);
            }
        } catch {
            setListingDetails(null);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Marketplace" subtitle="Live Auction — Credits" onBack={() => navigate('wallet')} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {!listed ? (
                    <>
                        <View style={styles.listingCard}>
                            <Text style={styles.listingHeading}>List Credits for Auction</Text>

                            <Text style={styles.inputLabel}>Credits to List (max {walletCredits})</Text>
                            <TextInput
                                style={styles.textInput}
                                value={credits}
                                onChangeText={setCredits}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={C.textDim}
                            />

                            <Text style={styles.inputLabel}>Minimum Bid Total Price (₹)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={floor}
                                onChangeText={setFloor}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={C.textDim}
                            />

                            <Text style={styles.inputLabel}>Bidding Closing Time (hours)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={durationHours}
                                onChangeText={setDurationHours}
                                keyboardType="numeric"
                                placeholder="24"
                                placeholderTextColor={C.textDim}
                            />

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleStartAuction}>
                                <Text style={styles.primaryBtnText}>{loading ? 'Starting...' : 'Start Auction →'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.marketInfoCard}>
                            <Text style={styles.marketInfoTitle}>Current Top Bid (Total)</Text>
                            <Text style={styles.marketInfoValue}>
                                {listingDetails?.top_bid?.total_inr ? `₹${Math.round(listingDetails.top_bid.total_inr).toLocaleString('en-IN')}` : 'No live market data'}
                            </Text>
                            <Text style={styles.marketInfoSub}>Based on live bids</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.auctionHeader}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE AUCTION</Text>
                            <Text style={styles.auctionTimer}>{listingDetails?.expires_at ? `Closes: ${new Date(listingDetails.expires_at).toLocaleString('en-IN')}` : 'Fetching...'}</Text>
                        </View>

                        <View style={styles.auctionInfo}>
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Listed</Text>
                                <Text style={styles.auctionInfoValue}>{credits} credits</Text>
                            </View>
                            <View style={styles.auctionInfoDivider} />
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Floor Total</Text>
                                <Text style={styles.auctionInfoValue}>₹{Number(floor || 0).toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={styles.auctionInfoDivider} />
                            <View style={styles.auctionInfoItem}>
                                <Text style={styles.auctionInfoLabel}>Top Bid (You Get)</Text>
                                <Text style={[styles.auctionInfoValue, { color: C.green }]}>{bids[0]?.payout ? `₹${bids[0].payout.toLocaleString('en-IN')}` : '--'}</Text>
                                {bids[0]?.total && <Text style={styles.auctionInfoSub}>Bid: ₹{bids[0].total.toLocaleString('en-IN')} (10% platform fee)</Text>}
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
                                    <Text style={styles.bidTime}>{b.time || 'Now'}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.bidAmount, b.top && { color: C.amber }]}>₹{b.payout.toLocaleString('en-IN')}</Text>
                                    <Text style={styles.bidTotal}>You receive (bid: ₹{b.total.toLocaleString('en-IN')})</Text>
                                </View>
                                {b.top && (
                                    <View style={styles.topBadge}>
                                        <Text style={styles.topBadgeText}>TOP</Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        {!bids.length && (
                            <View style={styles.noticeCard}>
                                <Text style={styles.noticeIcon}>ℹ️</Text>
                                <Text style={styles.noticeText}>No bids yet for this listing.</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryBtn, styles.acceptBtn, !bids.length && styles.primaryBtnDisabled]}
                            onPress={handleAcceptTopBid}
                            disabled={!bids.length}
                        >
                            <Text style={styles.primaryBtnText}>
                                {bids[0]
                                    ? `✓  Accept Top Bid — You get ₹${bids[0].payout.toLocaleString('en-IN')}`
                                    : 'No bid to accept'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel}>
                            <Text style={styles.secondaryBtnText}>Cancel Auction</Text>
                        </TouchableOpacity>
                    </>
                )}
                {!!hint && <Text style={[styles.otpHint, { marginTop: 10 }]}>{hint}</Text>}
            </ScrollView>
        </SafeAreaView>
    );
}
