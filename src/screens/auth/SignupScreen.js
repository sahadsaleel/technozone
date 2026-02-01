import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SignupScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signup } = useAuth();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setLoading(true);
        const success = await signup(username, email, password);
        setLoading(false);

        if (success) {
            navigation.navigate('Login');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={theme.dark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Text style={[styles.logo, { color: theme.colors.primary }]}>TechnoZone</Text>
                    <View style={[styles.logoDivider, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Create your account</Text>
                </View>

                {/* Form Section */}
                <View style={styles.form}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="Username"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="Email"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <View>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        {password.length > 0 && (() => {
                            let score = 0;
                            if (password.length >= 8) score++;
                            if (/[a-zA-Z]/.test(password)) score++;
                            if (/\d/.test(password)) score++;
                            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

                            // Map score 0-4 to status
                            let color = '#FF4D4D'; // Weak (Red)
                            let label = 'Weak';
                            let width = '30%';

                            if (score >= 4) {
                                color = '#4CAF50'; // Strong (Green)
                                label = 'Strong';
                                width = '100%';
                            } else if (score >= 2) {
                                color = '#FFC107'; // Medium (Yellow)
                                label = 'Medium';
                                width = '60%';
                            }

                            return (
                                <View style={styles.strengthContainer}>
                                    <View style={[styles.strengthBarContainer, { backgroundColor: theme.colors.border }]}>
                                        <View style={[styles.strengthBar, { width: width, backgroundColor: color }]} />
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: color }]}>{label}</Text>
                                </View>
                            );
                        })()}
                    </View>

                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="Confirm Password"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.link, { color: theme.colors.primary }]}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logo: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    logoDivider: {
        width: 60,
        height: 3,
        marginVertical: 12,
        borderRadius: 2,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '400',
    },
    form: {
        marginBottom: 24,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 15,
        fontSize: 15,
        marginBottom: 16,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
    },
    link: {
        fontSize: 14,
        fontWeight: '600',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    strengthBarContainer: {
        width: '50%',
        height: 4,
        borderRadius: 2,
        marginRight: 10,
        overflow: 'hidden',
    },
    strengthBar: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
});

