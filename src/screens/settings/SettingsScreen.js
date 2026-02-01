import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Alert, Modal, TextInput, ActivityIndicator
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
// import { colors } from '../../constants/colors'; // Using theme colors instead
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
        {type === 'link' && <Text style={{ color: theme.colors.textSecondary }}>›</Text>}
        {(type === 'value' || type === 'info') && <Text style={{ color: theme.colors.textSecondary }}>{value}</Text>}
    </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
    const { logout, userData, userToken } = useAuth(); // Assuming userData is available in context
    const { theme, themePreference, updateTheme, fontSize, updateFontSize } = useTheme();

    // State for Profile
    const [name, setName] = useState(userData?.name || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    // State for Password
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // State for Danger Zone
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // --- Profile Handlers ---
    const handleUpdateProfile = async () => {
        if (!name || !email) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }
        setProfileLoading(true);
        try {
            await api.put('/user/profile', { name, email });
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditingProfile(false);
            // Ideally update auth context user data here
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    // --- Security Handlers ---
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Both fields are required');
            return;
        }
        setPasswordLoading(true);
        try {
            await api.put('/user/password', { currentPassword, newPassword });
            Alert.alert('Success', 'Password updated successfully');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    // --- Data Handlers ---
    const handleExportData = async () => {
        try {
            const res = await api.get('/user/export');
            const userData = JSON.stringify(res.data, null, 2);
            const fileUri = FileSystem.documentDirectory + 'TechnoZone_Backup.json';

            await FileSystem.writeAsStringAsync(fileUri, userData, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', 'Data saved to ' + fileUri);
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const handleImportData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const fileUri = result.assets ? result.assets[0].uri : result.uri; // Handle new/old expo-document-picker API
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const parsedData = JSON.parse(fileContent);

            Alert.alert(
                'Confirm Import',
                'This will merge/update your existing data with the file content. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Import',
                        onPress: async () => {
                            try {
                                setProfileLoading(true); // Reuse loading state or create new one
                                await api.post('/user/import', parsedData);
                                Alert.alert('Success', 'Data imported successfully');
                            } catch (error) {
                                console.error('Import API Error:', error);
                                Alert.alert('Error', 'Failed to import data: ' + (error.response?.data?.message || error.message));
                            } finally {
                                setProfileLoading(false);
                            }
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Import Error:', error);
            Alert.alert('Error', 'Failed to read import file');
        }
    };

    // --- Danger Zone Handlers ---
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            Alert.alert('Error', 'Password is required to delete account');
            return;
        }
        setDeleteLoading(true);
        try {
            await api.delete('/user/account', { data: { password: deletePassword } });
            await logout(); // Logout handles navigation to login
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
            setDeleteLoading(false);
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => setShowDeleteModal(true) }
            ]
        );
    };

    const containerStyle = { backgroundColor: theme.colors.background };
    const textStyle = { color: theme.colors.text };
    const subTextStyle = { color: theme.colors.textSecondary };
    const cardStyle = { backgroundColor: theme.colors.card, borderColor: theme.colors.border };

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Profile Settings */}
                <SectionHeader title="Profile Settings" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    {isEditingProfile ? (
                        <View style={styles.formContainer}>
                            <Text style={[styles.label, textStyle]}>Name</Text>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={[styles.label, textStyle]}>Email</Text>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.smallButton, { backgroundColor: theme.colors.textSecondary }]}
                                    onPress={() => setIsEditingProfile(false)}
                                >
                                    <Text style={styles.smallButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.smallButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={handleUpdateProfile}
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.smallButtonText}>Save</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <SettingItem
                                label="Name"
                                value={name}
                                type="value"
                                onPress={() => setIsEditingProfile(true)}
                                theme={theme}
                            />
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <SettingItem
                                label="Email"
                                value={email}
                                type="value"
                                onPress={() => setIsEditingProfile(true)}
                                theme={theme}
                            />
                        </>
                    )}
                </View>

                {/* 2. Account Security */}
                <SectionHeader title="Account Security" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    <SettingItem
                        label="Change Password"
                        onPress={() => setShowPasswordModal(true)}
                        theme={theme}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <SettingItem
                        label="Logout"
                        onPress={() => {
                            Alert.alert('Logout', 'Are you sure you want to logout?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', onPress: logout, style: 'destructive' }
                            ]);
                        }}
                        theme={theme}
                    />
                </View>

                {/* 3. Theme & Appearance */}
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

                {/* 4. Data & Storage */}
                <SectionHeader title="Data & Storage" theme={theme} />
                <View style={[styles.card, cardStyle]}>
                    <SettingItem
                        label="Export Data (Backup)"
                        subLabel="Download a JSON file of your data"
                        onPress={handleExportData}
                        theme={theme}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <SettingItem
                        label="Import Data (Restore)"
                        subLabel="Restore from a backup JSON file"
                        onPress={handleImportData}
                        theme={theme}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <SettingItem
                        label="Storage Usage"
                        value="Calculated on Export"
                        type="info"
                        theme={theme}
                    />
                </View>

                {/* 5. Danger Zone */}
                <SectionHeader title="Danger Zone" theme={theme} />
                <View style={[styles.card, { borderColor: theme.colors.danger, borderWidth: 1, backgroundColor: 'rgba(255, 59, 48, 0.05)' }]}>
                    <TouchableOpacity style={styles.dangerItem} onPress={confirmDelete}>
                        <Text style={[styles.dangerText, { color: theme.colors.danger }]}>Delete Account</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Permanently remove your account and data</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Password Change Modal */}
            <Modal visible={showPasswordModal} transparent animationType="slide">
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
                                onPress={() => setShowPasswordModal(false)}
                            >
                                <Text style={styles.smallButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleChangePassword}
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.smallButtonText}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal visible={showDeleteModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, cardStyle]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.danger }]}>Confirm Deletion</Text>
                        <Text style={[styles.modalText, textStyle]}>
                            Please enter your password to confirm account deletion. This action is irreversible.
                        </Text>

                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                        />

                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: theme.colors.textSecondary }]}
                                onPress={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword('');
                                }}
                            >
                                <Text style={styles.smallButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: theme.colors.danger }]}
                                onPress={handleDeleteAccount}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.smallButtonText}>Delete</Text>}
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
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
    },
    rowItem: {
        padding: 16,
        flexDirection: 'column',
    },
    toggleRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    optionBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dangerItem: {
        padding: 16,
        alignItems: 'center',
    },
    dangerText: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    // Form Styles
    formContainer: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    smallButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        marginBottom: 20,
    }
});
