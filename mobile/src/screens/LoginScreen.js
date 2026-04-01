import React, { useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';

export default function LoginScreen({ navigate }) {
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor={C.ocean} />
            <ScrollView contentContainerStyle={styles.loginContainer}>
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🌊</Text>
                    </View>
                    <Text style={styles.appName}>SEACRED</Text>
                    <Text style={styles.appTagline}>Ocean Waste · Verified Credits</Text>
                </View>

                <View style={styles.waveLines}>
                    {[0.3, 0.5, 0.7].map((op, i) => (
                        <View key={i} style={[styles.waveLine, { opacity: op, marginBottom: i * 4 }]} />
                    ))}
                </View>

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
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => setOtpSent(true)}>
                            <Text style={styles.primaryBtnText}>Send OTP →</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <Text style={styles.otpHint}>OTP sent to +91 {phone}</Text>
                            <View style={styles.otpRow}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
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
                            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => navigate('profile')}>
                                <Text style={styles.primaryBtnText}>Verify & Enter →</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

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
}
