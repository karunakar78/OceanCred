import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, SafeAreaView, Dimensions, FlatList,
  Image, Animated
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  ocean:    '#020B18',
  deep:     '#040F1E',
  navy:     '#071527',
  surface:  '#0A1E30',
  card:     '#0D2540',
  border:   '#143556',
  cyan:     '#00D4C8',
  cyanDim:  '#00A89E',
  cyanGlow: 'rgba(0,212,200,0.15)',
  teal:     '#0ABFA0',
  amber:    '#F5A623',
  green:    '#27C97A',
  red:      '#FF5252',
  textPri:  '#E8F4F8',
  textSec:  '#7FB5CC',
  textDim:  '#3A6E8A',
  white:    '#FFFFFF',
};

const F = {
  brand: 'System',  // will use custom fonts in a real app
  mono: 'Courier',
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

const WaveHeader = ({ title, subtitle, onBack }) => (
  <View style={styles.header}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
    )}
    <View style={onBack ? { marginLeft: 8 } : {}}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
    </View>
  </View>
);

const Tag = ({ label, color = C.cyan }) => (
  <View style={[styles.tag, { borderColor: color, backgroundColor: color + '20' }]}>
    <Text style={[styles.tagText, { color }]}>{label}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const StatCard = ({ label, value, unit, accent = C.cyan }) => (
  <View style={[styles.statCard, { borderColor: accent + '40' }]}>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── SCREEN 1: LOGIN ─────────────────────────────────────────────────────────
const LoginScreen = ({ navigate }) => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.ocean} />
      <ScrollView contentContainerStyle={styles.loginContainer}>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌊</Text>
          </View>
          <Text style={styles.appName}>SEACRED</Text>
          <Text style={styles.appTagline}>Ocean Waste · Verified Credits</Text>
        </View>

        {/* Decorative wave lines */}
        <View style={styles.waveLines}>
          {[0.3, 0.5, 0.7].map((op, i) => (
            <View key={i} style={[styles.waveLine, { opacity: op, marginBottom: i * 4 }]} />
          ))}
        </View>

        {/* Login card */}
        <View style={styles.loginCard}>
          <Text style={styles.loginHeading}>Fisherman Login</Text>
          <Text style={styles.loginSub}>Enter your registered mobile number</Text>

          <View style={styles.inputRow}>
            <View style={styles.flagBox}>
              <Text style={styles.flagText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor={C.textDim}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>

          {!otpSent ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setOtpSent(true)}
            >
              <Text style={styles.primaryBtnText}>Send OTP →</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.otpHint}>OTP sent to +91 {phone}</Text>
              <View style={styles.otpRow}>
                {[0,1,2,3,4,5].map(i => (
                  <View key={i} style={styles.otpBox}>
                    <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput
                style={{ height: 0, width: 0 }}
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 20 }]}
                onPress={() => navigate('profile')}
              >
                <Text style={styles.primaryBtnText}>Verify & Enter →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { v: '2,847', l: 'Fishermen' },
            { v: '14.2T', l: 'Waste Collected' },
            { v: '₹38L', l: 'Credits Paid' },
          ].map((s, i) => (
            <View key={i} style={styles.stripItem}>
              <Text style={styles.stripValue}>{s.v}</Text>
              <Text style={styles.stripLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── SCREEN 1B: PROFILE ──────────────────────────────────────────────────────
const ProfileScreen = ({ navigate }) => {
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

        {/* Profile card */}
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

        {/* Stats */}
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
            <View style={[styles.statusPill, { backgroundColor: u.status === 'sold' ? C.green + '20' : C.amber + '20' }]}>
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
};

// ─── SCREEN 2: UPLOAD ────────────────────────────────────────────────────────
const UploadScreen = ({ navigate }) => {
  const [captured, setCaptured] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <WaveHeader title="Upload Waste" subtitle="Photo + GPS + Time — tamper-proof" onBack={() => navigate('profile')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Camera viewfinder */}
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

        {/* Auto-capture metadata */}
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

        {/* Security notice */}
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
          <Text style={styles.primaryBtnText}>
            {captured ? 'Submit for AI Verification →' : 'Take Photo First'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── SCREEN 3: AI RESULT ─────────────────────────────────────────────────────
const ResultScreen = ({ navigate }) => {
  const checks = [
    { label: 'Real waste detected', detail: 'Confidence 97.3%', ok: true },
    { label: 'GPS in valid water body', detail: 'Arabian Sea — verified', ok: true },
    { label: "Date matches today", detail: 'Apr 01, 2026 — confirmed', ok: true },
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

        {/* Verification checks */}
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

        {/* Location badge */}
        <View style={styles.locationBadge}>
          <Text style={styles.locationIcon}>🌊</Text>
          <View>
            <Text style={styles.locationName}>Arabian Sea</Text>
            <Text style={styles.locationCoords}>12.4°N  74.2°E · Apr 01, 2026</Text>
          </View>
        </View>

        {/* Detected waste */}
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

        {/* Total credits earned */}
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
};

// ─── SCREEN 4: WALLET ────────────────────────────────────────────────────────
const WalletScreen = ({ navigate }) => {
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

        {/* Balance */}
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

        {/* Credit breakdown */}
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
              {h.credits > 0 ? '+' : ''}{h.credits}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={() => navigate('marketplace')}>
          <Text style={styles.primaryBtnText}>List on Marketplace →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── SCREEN 5: MARKETPLACE ───────────────────────────────────────────────────
const MarketplaceScreen = ({ navigate }) => {
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
            {/* Listing form */}
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

            {/* Market info */}
            <View style={styles.marketInfoCard}>
              <Text style={styles.marketInfoTitle}>Current Market Rate</Text>
              <Text style={styles.marketInfoValue}>₹178 / credit</Text>
              <Text style={styles.marketInfoSub}>7-day average · Arabian Sea region</Text>
            </View>
          </>
        ) : (
          <>
            {/* Live auction status */}
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
              <Text style={styles.primaryBtnText}>✓  Accept Top Bid — ₹{(185 * parseInt(credits)).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setListed(false)}>
              <Text style={styles.secondaryBtnText}>Cancel Auction</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────
const BottomNav = ({ active, navigate }) => {
  const tabs = [
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'upload',  icon: '📷', label: 'Upload'  },
    { id: 'result',  icon: '🤖', label: 'AI Result'},
    { id: 'wallet',  icon: '💎', label: 'Wallet'   },
    { id: 'marketplace', icon: '📊', label: 'Market' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map(t => (
        <TouchableOpacity key={t.id} style={styles.navTab} onPress={() => navigate(t.id)}>
          <Text style={[styles.navIcon, active === t.id && styles.navIconActive]}>{t.icon}</Text>
          <Text style={[styles.navLabel, active === t.id && styles.navLabelActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('login');

  const renderScreen = () => {
    switch (screen) {
      case 'login':       return <LoginScreen navigate={setScreen} />;
      case 'profile':     return <ProfileScreen navigate={setScreen} />;
      case 'upload':      return <UploadScreen navigate={setScreen} />;
      case 'result':      return <ResultScreen navigate={setScreen} />;
      case 'wallet':      return <WalletScreen navigate={setScreen} />;
      case 'marketplace': return <MarketplaceScreen navigate={setScreen} />;
      default:            return <LoginScreen navigate={setScreen} />;
    }
  };

  const showNav = screen !== 'login';

  return (
    <View style={{ flex: 1, backgroundColor: C.ocean }}>
      {renderScreen()}
      {showNav && <BottomNav active={screen} navigate={setScreen} />}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ocean },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
    backgroundColor: C.deep,
  },
  backBtn: { marginRight: 4, padding: 4 },
  backArrow: { color: C.cyan, fontSize: 22, fontWeight: '300' },
  headerTitle: { color: C.textPri, fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
  headerSub: { color: C.textSec, fontSize: 12, marginTop: 2 },

  // Login
  loginContainer: { paddingBottom: 60, alignItems: 'center' },
  logoArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.cyanGlow, borderWidth: 1.5,
    borderColor: C.cyan, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 36 },
  appName: { color: C.cyan, fontSize: 32, fontWeight: '900', letterSpacing: 8 },
  appTagline: { color: C.textSec, fontSize: 13, marginTop: 6, letterSpacing: 1.5 },

  waveLines: { width: '100%', paddingHorizontal: 30, marginBottom: 20 },
  waveLine: {
    height: 1, backgroundColor: C.cyan, borderRadius: 1,
    marginBottom: 6, marginHorizontal: 20,
  },

  loginCard: {
    width: width - 40, backgroundColor: C.card,
    borderRadius: 20, padding: 24, borderWidth: 0.5,
    borderColor: C.border,
  },
  loginHeading: { color: C.textPri, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  loginSub: { color: C.textSec, fontSize: 13, marginBottom: 24 },

  inputRow: { flexDirection: 'row', marginBottom: 16 },
  flagBox: {
    backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 14,
    justifyContent: 'center', marginRight: 10, borderWidth: 0.5, borderColor: C.border,
  },
  flagText: { color: C.textPri, fontSize: 15, fontWeight: '600' },
  phoneInput: {
    flex: 1, backgroundColor: C.surface, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, color: C.textPri,
    fontSize: 16, borderWidth: 0.5, borderColor: C.border,
  },

  otpHint: { color: C.textSec, fontSize: 12, marginBottom: 14, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 42, height: 48, borderRadius: 10, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  otpDigit: { color: C.cyan, fontSize: 22, fontWeight: '700' },

  statsStrip: {
    flexDirection: 'row', marginTop: 28, width: width - 40,
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: C.border, justifyContent: 'space-around',
  },
  stripItem: { alignItems: 'center' },
  stripValue: { color: C.cyan, fontSize: 18, fontWeight: '800' },
  stripLabel: { color: C.textSec, fontSize: 11, marginTop: 3 },

  // Buttons
  primaryBtn: {
    backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  primaryBtnDisabled: { backgroundColor: C.textDim },
  primaryBtnText: { color: C.ocean, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  secondaryBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 10,
  },
  secondaryBtnText: { color: C.textSec, fontSize: 15, fontWeight: '600' },
  acceptBtn: { backgroundColor: C.green, marginTop: 20 },

  // Tags & pills
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
  tagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  divider: { height: 0.5, backgroundColor: C.border, marginVertical: 14 },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statUnit: { color: C.textSec, fontSize: 11 },
  statLabel: { color: C.textSec, fontSize: 10, marginTop: 4, textAlign: 'center' },

  // Profile
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 20, padding: 20, marginHorizontal: 16, marginTop: 16,
    marginBottom: 16, borderWidth: 0.5, borderColor: C.border,
  },
  avatarRing: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.cyanGlow,
    borderWidth: 2, borderColor: C.cyan, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.cyan, fontSize: 22, fontWeight: '800' },
  profileName: { color: C.textPri, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  profileSub: { color: C.textSec, fontSize: 13, marginBottom: 6 },

  sectionTitle: {
    color: C.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 10, marginTop: 8,
  },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  historyDate: {
    width: 46, height: 46, backgroundColor: C.surface, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  historyDateText: { color: C.textSec, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  historyType: { color: C.textPri, fontSize: 14, fontWeight: '600' },
  historyMeta: { color: C.textSec, fontSize: 12, marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Upload screen
  viewfinder: {
    height: 260, backgroundColor: C.surface, borderRadius: 20, marginBottom: 20,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  vfCornerTL: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTopWidth: 2, borderLeftWidth: 2, borderColor: C.cyan },
  vfCornerTR: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTopWidth: 2, borderRightWidth: 2, borderColor: C.cyan },
  vfCornerBL: { position: 'absolute', bottom: 60, left: 16, width: 24, height: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: C.cyan },
  vfCornerBR: { position: 'absolute', bottom: 60, right: 16, width: 24, height: 24, borderBottomWidth: 2, borderRightWidth: 2, borderColor: C.cyan },
  vfIcon: { fontSize: 48, marginBottom: 10 },
  vfText: { color: C.textSec, fontSize: 14 },
  vfCaptured: { color: C.green, fontSize: 56, marginBottom: 10 },
  captureBtn: {
    position: 'absolute', bottom: 20, width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: C.cyan, alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.cyan },

  metaCard: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  metaRowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  metaIcon: { fontSize: 20, marginRight: 12, width: 28 },
  metaLabel: { color: C.textSec, fontSize: 11, marginBottom: 2 },
  metaValue: { color: C.textPri, fontSize: 14, fontWeight: '600', fontFamily: F.mono },

  noticeCard: {
    flexDirection: 'row', backgroundColor: C.cyanGlow, borderRadius: 12,
    padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: C.cyan + '40',
  },
  noticeIcon: { fontSize: 20, marginRight: 10 },
  noticeText: { color: C.textSec, fontSize: 13, flex: 1, lineHeight: 20 },

  // Result screen
  verifyCard: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  checkDot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  checkLabel: { color: C.textPri, fontSize: 14, fontWeight: '600' },
  checkDetail: { color: C.textSec, fontSize: 12, marginTop: 2 },

  locationBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: C.border,
  },
  locationIcon: { fontSize: 28, marginRight: 14 },
  locationName: { color: C.cyan, fontSize: 16, fontWeight: '700' },
  locationCoords: { color: C.textSec, fontSize: 12, fontFamily: F.mono, marginTop: 2 },

  detectedRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 12, marginBottom: 10, padding: 14, borderLeftWidth: 3,
    borderWidth: 0.5, borderColor: C.border,
  },
  detectedType: { flex: 1, fontSize: 15, fontWeight: '700' },
  detectedMeta: { color: C.textSec, fontSize: 13, marginHorizontal: 10 },
  creditBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  creditBadgeText: { fontSize: 13, fontWeight: '800' },

  totalCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, marginVertical: 16,
    borderWidth: 1, borderColor: C.cyan + '30', alignItems: 'center',
  },
  totalLabel: { color: C.textSec, fontSize: 12, letterSpacing: 1 },
  totalWeight: { color: C.textPri, fontSize: 28, fontWeight: '700', marginVertical: 4 },
  totalCredits: { color: C.cyan, fontSize: 56, fontWeight: '900' },
  totalCreditsUnit: { color: C.cyanDim, fontSize: 16, letterSpacing: 2, fontWeight: '600' },

  // Wallet
  balanceCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, marginHorizontal: 16,
    marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cyan + '30',
  },
  balanceLabel: { color: C.textSec, fontSize: 12, letterSpacing: 1.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginVertical: 6 },
  balanceValue: { color: C.cyan, fontSize: 60, fontWeight: '900', lineHeight: 70 },
  balanceUnit: { color: C.cyanDim, fontSize: 20, fontWeight: '600' },
  balanceEst: { color: C.textSec, fontSize: 13 },
  balanceDivider: { height: 0.5, backgroundColor: C.border, marginVertical: 16 },
  balanceFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balFooterLabel: { color: C.textSec, fontSize: 11 },
  balFooterValue: { color: C.textPri, fontSize: 15, fontWeight: '700', marginTop: 3 },

  txRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  txAmount: { fontSize: 16, fontWeight: '800', minWidth: 36, textAlign: 'right' },

  // Marketplace
  listingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 0.5, borderColor: C.border,
  },
  listingHeading: { color: C.textPri, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  inputLabel: { color: C.textSec, fontSize: 12, letterSpacing: 0.5, marginBottom: 6 },
  textInput: {
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    color: C.textPri, fontSize: 20, fontWeight: '700', borderWidth: 0.5,
    borderColor: C.border, marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 4,
  },
  estimateLabel: { color: C.textSec, fontSize: 13 },
  estimateValue: { color: C.green, fontSize: 18, fontWeight: '800' },

  marketInfoCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 0.5, borderColor: C.border, alignItems: 'center',
  },
  marketInfoTitle: { color: C.textSec, fontSize: 11, letterSpacing: 1.5, marginBottom: 6 },
  marketInfoValue: { color: C.amber, fontSize: 28, fontWeight: '800' },
  marketInfoSub: { color: C.textSec, fontSize: 11, marginTop: 4 },

  auctionHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: C.border,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, marginRight: 8 },
  liveText: { color: C.red, fontSize: 13, fontWeight: '800', letterSpacing: 2, flex: 1 },
  auctionTimer: { color: C.textSec, fontSize: 14, fontFamily: F.mono },

  auctionInfo: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, marginBottom: 16,
    borderWidth: 0.5, borderColor: C.border, overflow: 'hidden',
  },
  auctionInfoItem: { flex: 1, padding: 14, alignItems: 'center' },
  auctionInfoLabel: { color: C.textSec, fontSize: 11, marginBottom: 4 },
  auctionInfoValue: { color: C.textPri, fontSize: 16, fontWeight: '700' },
  auctionInfoDivider: { width: 0.5, backgroundColor: C.border },

  bidRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: C.border,
  },
  bidRowTop: { borderColor: C.amber + '60', backgroundColor: C.amber + '08' },
  companyLogo: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  companyLogoText: { color: C.textSec, fontSize: 13, fontWeight: '800' },
  companyName: { color: C.textPri, fontSize: 14, fontWeight: '600' },
  bidTime: { color: C.textDim, fontSize: 11, marginTop: 2 },
  bidAmount: { color: C.textPri, fontSize: 16, fontWeight: '800' },
  bidTotal: { color: C.textSec, fontSize: 11, marginTop: 2 },
  topBadge: {
    position: 'absolute', top: -1, right: -1, backgroundColor: C.amber,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  topBadgeText: { color: C.ocean, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Bottom Nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: C.deep, borderTopWidth: 0.5,
    borderTopColor: C.border, paddingBottom: 20, paddingTop: 10,
  },
  navTab: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { fontSize: 20, opacity: 0.4 },
  navIconActive: { opacity: 1 },
  navLabel: { color: C.textDim, fontSize: 10, fontWeight: '600' },
  navLabelActive: { color: C.cyan },
});
