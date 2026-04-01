import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';

export const WaveHeader = ({ title, subtitle, onBack }) => (
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

export const Tag = ({ label, color = C.cyan }) => (
    <View style={[styles.tag, { borderColor: color, backgroundColor: color + '20' }]}>
        <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
);

export const Divider = () => <View style={styles.divider} />;

export const StatCard = ({ label, value, unit, accent = C.cyan }) => (
    <View style={[styles.statCard, { borderColor: accent + '40' }]}>
        <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

export const BottomNav = ({ active, navigate }) => {
    const tabs = [
        { id: 'profile', icon: '👤', label: 'Profile' },
        { id: 'upload', icon: '📷', label: 'Upload' },
        { id: 'result', icon: '🤖', label: 'AI Result' },
        { id: 'wallet', icon: '💎', label: 'Wallet' },
        { id: 'marketplace', icon: '📊', label: 'Market' },
    ];

    return (
        <View style={styles.bottomNav}>
            {tabs.map((t) => (
                <TouchableOpacity key={t.id} style={styles.navTab} onPress={() => navigate(t.id)}>
                    <Text style={[styles.navIcon, active === t.id && styles.navIconActive]}>{t.icon}</Text>
                    <Text style={[styles.navLabel, active === t.id && styles.navLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};
