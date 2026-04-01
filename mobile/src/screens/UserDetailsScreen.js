import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';
import { WaveHeader } from '../components/Shared';
import { mobileApi } from '../api/mobileApi';

export default function UserDetailsScreen({ token, onCompleted }) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (name.trim().length < 2 || location.trim().length < 2) {
            setError('Please enter valid name and location.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const updatedUser = await mobileApi.completeOnboarding(token, {
                name: name.trim(),
                location: location.trim(),
            });
            onCompleted(updatedUser);
        } catch (e) {
            setError(e.message || 'Could not save details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <WaveHeader title="Complete Profile" subtitle="One-time setup" />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
                <View style={styles.listingCard}>
                    <Text style={styles.listingHeading}>Enter Your Details</Text>

                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={[styles.textInput, { fontSize: 16 }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor="#3A6E8A"
                    />

                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                        style={[styles.textInput, { fontSize: 16 }]}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Village / Coast"
                        placeholderTextColor="#3A6E8A"
                    />

                    <TouchableOpacity style={styles.primaryBtn} onPress={submit}>
                        <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : 'Save and Continue →'}</Text>
                    </TouchableOpacity>

                    {!!error && <Text style={[styles.otpHint, { marginTop: 10 }]}>{error}</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
