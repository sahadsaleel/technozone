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
import api from '../../services/api';

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

export default function SettingsScreen({ navigation }) {
    const { theme, themePreference, updateTheme, fontSize, updateFontSize } = useTheme();
    console.log("DEBUG: SettingsScreen Rendering");

    const name = 'Shop Owner';
    const email = 'owner@technozone.com';

    // State for UI
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // --- Data Management Handlers ---
    const handleDataBackup = async () => {
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

    const handleRestore = async () => {
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
                'This will merge/update your existing data with the backup file. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Restore',
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                await api.post('/user/import', jsonData);
                                Alert.alert('Success', 'Data restored successfully. Please restart the app for changes to take full effect.');
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

    const handleDeleteAllData = async () => {
        Alert.alert(
            '⚠️ PERMANENT DELETION',
            'This will DELETE ALL sales, expenses, and products. This action is IRREVERSIBLE. Are you 100% sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'DELETE EVERYTHING',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await api.delete('/user/data');
                            Alert.alert('Success', 'All records have been cleared.');
                        } catch (error) {
                            console.error('Delete All Data Error:', error);
                            Alert.alert('Error', 'Failed to clear data.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // --- Security Handlers ---
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Both fields are required');
            return;
        }
        setIsLoading(true);
        try {
            await api.put('/user/password', { currentPassword, newPassword });
            Alert.alert('Success', 'Password updated successfully');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle = { backgroundColor: theme.colors.background };
    const textStyle = { color: theme.colors.text };
    const cardStyle = { backgroundColor: theme.colors.card, borderColor: theme.colors.border };

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Theme & Appearance */}
                <SectionHeader title="Theme & Appearance" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    <View style={styles.rowItem}>
                        <Text style={[styles.settingLabel, textStyle]}>Theme</Text>
                        <View style={styles.toggleRow}>
                            {['light', 'dark', 'system'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.optionBtn,
                                        themePreference === t && { backgroundColor: theme.colors.primary }
                                    ]}
                                    onPress={() => updateTheme(t)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        themePreference === t ? { color: '#FFF' } : textStyle
                                    ]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.rowItem}>
                        <Text style={[styles.settingLabel, textStyle]}>Font Size</Text>
                        <View style={styles.toggleRow}>
                            {['small', 'normal', 'large'].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.optionBtn,
                                        fontSize === s && { backgroundColor: theme.colors.primary }
                                    ]}
                                    onPress={() => updateFontSize(s)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        fontSize === s ? { color: '#FFF' } : textStyle
                                    ]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Security */}
                <SectionHeader title="Account Security" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    <SettingItem
                        label="Change Password"
                        onPress={() => setShowPasswordModal(true)}
                        theme={theme}
                    />
                </View>

                {/* Data Management */}
                <SectionHeader title="Data Management" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    <SettingItem
                        label="Backup Data"
                        subLabel="Export sales, products, and expenses to a file"
                        onPress={handleDataBackup}
                        theme={theme}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <SettingItem
                        label="Restore Data"
                        subLabel="Import data from a previous backup file"
                        onPress={handleRestore}
                        theme={theme}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                    <TouchableOpacity
                        style={[styles.dangerItem]}
                        onPress={handleDeleteAllData}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.danger} />
                        ) : (
                            <View style={styles.dangerItemContent}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.dangerText, { color: theme.colors.danger }]}>Clear All Data</Text>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Delete all records permanently from this account</Text>
                                </View>
                                <MaterialCommunityIcons name="delete-forever-outline" size={24} color={theme.colors.danger} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Password Change Modal */}
            <Modal visible={showPasswordModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, cardStyle]}>
                        <Text style={[styles.modalTitle, textStyle]}>Change Password</Text>

                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Current Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="New Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: theme.colors.textSecondary }]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                }}
                            >
                                <Text style={styles.smallButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.smallButtonText}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 24,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    settingItem: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    settingSubLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    rowItem: {
        padding: 16,
        flexDirection: 'column',
    },
    toggleRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    optionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    dangerItem: {
        padding: 16,
    },
    dangerItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dangerText: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    smallButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    smallButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
});
