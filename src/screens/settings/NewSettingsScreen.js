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
});
