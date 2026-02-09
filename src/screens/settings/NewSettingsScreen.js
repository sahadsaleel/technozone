import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Alert, Modal, TextInput, ActivityIndicator
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api, { setApiBaseUrl, STORAGE_KEY_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SectionHeader = ({ title, theme }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>{title}</Text>
);

const SettingItem = ({ label, value, onPress, theme, type = 'link', subLabel }) => (
    <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={onPress}
        disabled={type === 'info'}
    >
        <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
            {subLabel && <Text style={[styles.settingSubLabel, { color: theme.colors.textSecondary }]}>{subLabel}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {(type === 'value' || type === 'info') && <Text style={{ color: theme.colors.textSecondary, marginRight: 8 }}>{value}</Text>}
            {type === 'link' && <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />}
        </View>
    </TouchableOpacity>
);

export default function NewSettingsScreen({ navigation }) {
    const { theme, themePreference, updateTheme, fontSize, updateFontSize } = useTheme();

    // State for UI
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // --- Server Config State ---
    const [serverUrl, setServerUrl] = useState('');
    const [isTestingConfig, setIsTestingConfig] = useState(false);

    // Load initial server URL
    React.useEffect(() => {
        const loadUrl = async () => {
            try {
                const url = await AsyncStorage.getItem(STORAGE_KEY_URL);
                if (url) setServerUrl(url);
            } catch (e) {
                console.error("Failed to load url", e);
            }
        };
        loadUrl();
    }, []);

    // --- Data Management Handlers ---
    const handleDoBackup = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/user/export');
            const userData = JSON.stringify(res.data, null, 2);
            const fileUri = FileSystem.cacheDirectory + 'TechnoZone_Backup.json';

            await FileSystem.writeAsStringAsync(fileUri, userData, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', 'Backup saved successfully.');
            }
        } catch (error) {
            console.error('Backup Error:', error);
            Alert.alert('Error', 'Failed to generate backup.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDoRestore = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
            const jsonData = JSON.parse(fileContent);

            Alert.alert(
                'Confirm Restore',
                'This will merge/update your existing data. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Restore',
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                await api.post('/user/import', jsonData);
                                Alert.alert('Success', 'Data restored successfully.');
                            } catch (error) {
                                console.error('Restore API Error:', error);
                                Alert.alert('Error', 'Failed to restore data.');
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Restore Error:', error);
            Alert.alert('Error', 'Failed to read backup file.');
        }
    };

    const handleClearData = async () => {
        Alert.alert(
            '⚠️ PERMANENT DELETION',
            'This will DELETE EVERYTHING permanently. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'DELETE EVERYTHING',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await api.delete('/user/data');
                            Alert.alert('Success', 'All data cleared.');
                        } catch (error) {
                            console.error('Delete Error:', error);
                            Alert.alert('Error', 'Failed to clear data.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };


    const handleUpdateServerUrl = async () => {
        if (!serverUrl || !serverUrl.trim()) {
            Alert.alert('Error', 'Please enter a valid URL');
            return;
        }

        // 1. Test Connection first
        setIsTestingConfig(true);
        try {
            const testUrl = serverUrl.trim().endsWith('/') ? serverUrl.trim().slice(0, -1) : serverUrl.trim();
            console.log(`Testing connection to: ${testUrl}/api/health`);

            // We use fetch here to be independent of the current axios instance
            const response = await fetch(`${testUrl}/api/health`);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.status === 'UP') {
                // 2. If success, save it
                const success = await setApiBaseUrl(testUrl);
                if (success) {
                    Alert.alert('Success', 'Connected to server successfully!\n\nAll app requests will now use this URL.');
                } else {
                    Alert.alert('Error', 'Connection worked but failed to save settings.');
                }
            } else {
                throw new Error('Invalid health check response');
            }
        } catch (error) {
            console.error('Connection Test Failed:', error);
            Alert.alert(
                'Connection Failed',
                `Could not connect to:\n${serverUrl}\n\nMake sure:\n1. The URL is correct (starts with http/https)\n2. The Tunnel/Server is running\n3. You have internet access`
            );
        } finally {
            setIsTestingConfig(false);
        }
    };

    const handleChangePass = async () => {
        if (!currentPassword || !newPassword) return;
        setIsLoading(true);
        try {
            await api.put('/user/password', { currentPassword, newPassword });
            Alert.alert('Success', 'Password changed');
            setShowPasswordModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <SectionHeader title="Server Configuration (Remote Access)" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, padding: 16 }]}>
                    <Text style={{ color: theme.colors.textSecondary, marginBottom: 8, fontSize: 13 }}>
                        Enter Tunnel URL to access from anywhere (e.g. from Mobile Data).
                        Run 'npm run tunnel' on PC to get this URL.
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            color: theme.colors.text,
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border
                        }]}
                        placeholder="https://..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={serverUrl}
                        onChangeText={setServerUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.colors.primary, opacity: isTestingConfig ? 0.7 : 1 }]}
                        onPress={handleUpdateServerUrl}
                        disabled={isTestingConfig}
                    >
                        {isTestingConfig ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Test & Save Connection</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <SectionHeader title="Appearance" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => updateTheme('light')} style={styles.rowItem}><Text style={{ color: theme.colors.text }}>Light Mode</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => updateTheme('dark')} style={styles.rowItem}><Text style={{ color: theme.colors.text }}>Dark Mode</Text></TouchableOpacity>
                </View>

                <SectionHeader title="Data Management" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <SettingItem label="Backup" onPress={handleDoBackup} theme={theme} />
                    <SettingItem label="Restore" onPress={handleDoRestore} theme={theme} />
                    <TouchableOpacity onPress={handleClearData} style={styles.dangerItem}>
                        <Text style={{ color: theme.colors.danger, fontWeight: 'bold' }}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20 },
    sectionHeader: { fontSize: 12, fontWeight: 'bold', marginVertical: 12, opacity: 0.6 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 20 },
    settingItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
    settingLabel: { fontSize: 16 },
    rowItem: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
    dangerItem: { padding: 16, alignItems: 'center' },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    primaryButton: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
