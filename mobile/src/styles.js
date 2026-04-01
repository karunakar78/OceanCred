import { StyleSheet } from 'react-native';
import { C, F, width } from './theme';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.ocean },

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

    loginContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
    },
    logoArea: { alignItems: 'center', paddingBottom: 24 },
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
    otpRowWrap: { position: 'relative', minHeight: 48 },
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

    tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
    tagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    divider: { height: 0.5, backgroundColor: C.border, marginVertical: 14 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
        alignItems: 'center', borderWidth: 1,
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statUnit: { color: C.textSec, fontSize: 11 },
    statLabel: { color: C.textSec, fontSize: 10, marginTop: 4, textAlign: 'center' },

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
    auctionInfoSub: { color: C.textSec, fontSize: 10, marginTop: 4 },
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

    // Modal Styles
    modalContent: { backgroundColor: C.card, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginBottom: 16 },
    modalRow: { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalLabel: { fontSize: 12, color: C.textSec, fontWeight: '600' },
    modalValue: { fontSize: 14, color: C.textPri, fontWeight: '600' },
    dangerBtn: { backgroundColor: C.red, borderRadius: 12, padding: 14, justifyContent: 'center', alignItems: 'center' },
    dangerBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
