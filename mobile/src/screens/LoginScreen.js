import React, { useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StyleSheet,
} from 'react-native';
import { styles } from '../styles';
import { C } from '../theme';
import { mobileApi } from '../api/mobileApi';

export default function LoginScreen({ navigate, onAuthSuccess }) {
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [hint, setHint] = useState('');
    const otpInputRef = useRef(null);
    const scrollRef = useRef(null);

    const normalizedPhone = phone.replace(/\D/g, '');

    useEffect(() => {
        if (otpSent) {
            // Delay focus slightly so keyboard opens reliably after render.
            const timer = setTimeout(() => {
                otpInputRef.current?.focus();
            }, 120);
            return () => clearTimeout(timer);
        }
    }, [otpSent]);

    useEffect(() => {
        const onShow = () => {
            if (otpSent) {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
            }
        };
        const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', onShow);
        return () => sub.remove();
    }, [otpSent]);

    const handleSendOtp = async () => {
        if (normalizedPhone.length < 10) {
            setHint('Enter a valid 10-digit phone number.');
            return;
        }

        try {
            setLoading(true);
            setHint('');
            await mobileApi.sendOtp(normalizedPhone);
            setOtpSent(true);
            setHint('OTP sent. Check backend terminal log for demo OTP.');
        } catch (error) {
            setHint(error.message || 'Could not send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setHint('Enter the 6-digit OTP.');
            return;
        }

        try {
            setLoading(true);
            setHint('');
            const res = await mobileApi.verifyOtp(normalizedPhone, otp);
            if (onAuthSuccess) {
                onAuthSuccess(res, normalizedPhone);
            } else {
                navigate('profile');
            }
        } catch (error) {
            setHint(error.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                <StatusBar barStyle="light-content" backgroundColor={C.ocean} />
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.loginContainer,
                        otpSent && { justifyContent: 'flex-start', paddingTop: 12, paddingBottom: 48 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🌊</Text>
                    </View>
                    <Text style={styles.appName}>SEACRED</Text>
                    <Text style={styles.appTagline}>Sea Waste · Verified Credits</Text>
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
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}>
                            <Text style={styles.primaryBtnText}>{loading ? 'Sending OTP...' : 'Send OTP →'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <Text style={styles.otpHint}>OTP sent to +91 {phone}</Text>
                            <View style={[styles.otpRow, styles.otpRowWrap]}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <View key={i} style={styles.otpBox}>
                                        <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
                                    </View>
                                ))}
                                <TextInput
                                    ref={otpInputRef}
                                    style={[StyleSheet.absoluteFillObject, { opacity: 0.02 }]}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={otp}
                                    onChangeText={setOtp}
                                    caretHidden
                                    importantForAutofill="yes"
                                    textContentType="oneTimeCode"
                                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={handleVerifyOtp}>
                                <Text style={styles.primaryBtnText}>{loading ? 'Verifying...' : 'Verify & Enter →'}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {!!hint && <Text style={[styles.otpHint, { marginTop: 10 }]}>{hint}</Text>}
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
