import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TouchableOpacity,
    Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReportsScreen = () => {
    const { theme } = useTheme();
    const [reportData, setReportData] = useState({
        totalSales: 0,
        totalExpenses: 0,
        totalPurchaseCost: 0,
        totalStockValue: 0,
        netProfit: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const [activeFilter, setActiveFilter] = useState('month'); // 'today', 'month', 'custom'
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [isCustomDate, setIsCustomDate] = useState(false);

    const fetchReportData = async (filter = activeFilter, start = null, end = null) => {
        try {
            let query = `?filter=${filter}`;
            if (filter === 'custom' && start && end) {
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }
            const response = await api.get(`/reports/summary${query}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Fetch Reports Error:', error);
            Alert.alert('Error', 'Failed to fetch report data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchReportData();
        }, [activeFilter])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchReportData();
    };

    const handleFilterChange = (filter) => {
        if (filter === 'custom') {
            setIsCustomDate(true);
            setShowFilterModal(true);
        } else {
            setActiveFilter(filter);
            setIsLoading(true);
            fetchReportData(filter);
        }
    };

    const downloadReport = async (filter, start = null, end = null) => {
        setShowFilterModal(false);
        setIsCustomDate(false);

        // Ensure UI settles before starting
        await new Promise(resolve => setTimeout(resolve, 400));

        setIsDownloading(true);
        try {
            const params = { filter };
            if (filter === 'custom' && start && end) {
                params.startDate = start.toISOString();
                params.endDate = end.toISOString();
            }

            const downloadUrl = api.getUri({
                url: '/reports/excel',
                params: params
            });


            const filename = `Report_${filter}_${Date.now()}.xlsx`;
            const fileUri = FileSystem.cacheDirectory + filename;
            const token = await AsyncStorage.getItem('userToken');

            const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri, {
                headers: { 'Authorization': `Bearer ${token}` }
            });


            if (downloadRes.status !== 200) {
                throw new Error(`Download failed with status ${downloadRes.status}`);
            }

            // Verify file status
            const info = await FileSystem.getInfoAsync(fileUri);

            if (!info.exists || info.size === 0) {
                throw new Error('The downloaded file appears to be empty.');
            }

            // Stop loading state BEFORE opening the system share sheet
            setIsDownloading(false);

            // Give React state updates time to finish
            setTimeout(async () => {
                try {
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri, {
                            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            UTI: 'org.openxmlformats.spreadsheetml.sheet'
                        });
                    } else {
                        Alert.alert('Download Finished', `Report saved to: ${filename}`);
                    }
                } catch (shareErr) {
                    console.error('[Frontend] Share Sheet Error:', shareErr);
                    Alert.alert('Sharing Error', 'Report downloaded but failed to open share sheet.');
                }
            }, 200);

        } catch (error) {
            console.error('[Frontend] Global Error:', error);
            setIsDownloading(false);
            Alert.alert('Download Error', error.message || 'An unexpected error occurred during download.');
        }
    };

    const onStartChange = (event, selectedDate) => {
        setShowStartPicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndChange = (event, selectedDate) => {
        setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    const applyCustomRange = () => {
        setActiveFilter('custom');
        setShowFilterModal(false);
        setIsLoading(true);
        fetchReportData('custom', startDate, endDate);
    };

    const StatCard = ({ icon, title, value, color, iconBg }) => (
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{title}</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    ₹{Math.abs(value).toLocaleString('en-IN')}
                </Text>
            </View>
        </View>
    );

    const ProfitLossCard = ({ value }) => {
        const isProfit = value >= 0;
        const statusColor = isProfit ? theme.colors.success : theme.colors.danger;
        const bgColor = isProfit ? (theme.dark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9') : (theme.dark ? 'rgba(255, 82, 82, 0.15)' : '#FFEBEE');

        return (
            <View style={[styles.profitLossCard, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                <View style={styles.profitLossHeader}>
                    <MaterialCommunityIcons
                        name={isProfit ? 'trending-up' : 'trending-down'}
                        size={32}
                        color={statusColor}
                    />
                    <Text style={[styles.profitLossTitle, { color: theme.colors.text }]}>Net {isProfit ? 'Profit' : 'Loss'}</Text>
                </View>
                <Text style={[styles.profitLossValue, { color: statusColor }]}>
                    {isProfit ? '+' : '-'}₹{Math.abs(value).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.profitLossSub, { color: theme.colors.textSecondary }]}>{activeFilter === 'today' ? 'For Today' : activeFilter === 'month' ? 'For This Month' : 'Custom Range'}</Text>
            </View>
        );
    };

    if (isLoading && !isRefreshing) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Financial Reports</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Overview of your business</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.downloadIconButton, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}
                        onPress={() => {
                            setIsCustomDate(false);
                            setShowFilterModal(true);
                        }}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                            <MaterialCommunityIcons name="download" size={24} color={theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Filter Tab Bar */}
                <View style={[styles.filterBar, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'today' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleFilterChange('today')}
                    >
                        <Text style={[styles.filterTabText, { color: theme.colors.textSecondary }, activeFilter === 'today' && styles.activeFilterTabText]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'month' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleFilterChange('month')}
                    >
                        <Text style={[styles.filterTabText, { color: theme.colors.textSecondary }, activeFilter === 'month' && styles.activeFilterTabText]}>This Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'custom' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleFilterChange('custom')}
                    >
                        <Text style={[styles.filterTabText, { color: theme.colors.textSecondary }, activeFilter === 'custom' && styles.activeFilterTabText]}>Custom</Text>
                    </TouchableOpacity>
                </View>

                {/* Profit/Loss Card */}
                <ProfitLossCard value={reportData.netProfit} />

                {/* Statistics Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="trending-up"
                        title="Total Sales"
                        value={reportData.totalSales}
                        color={colors.success}
                        iconBg={`${colors.success}10`}
                    />
                    <StatCard
                        icon="trending-down"
                        title="Total Expenses"
                        value={reportData.totalExpenses}
                        color={colors.error}
                        iconBg={`${colors.error}10`}
                    />
                    <StatCard
                        icon="cart-outline"
                        title="Purchase Cost"
                        value={reportData.totalPurchaseCost}
                        color="#8E24AA"
                        iconBg="#F3E5F5"
                    />
                    <StatCard
                        icon="package-variant-closed"
                        title="Stock Value"
                        value={reportData.totalStockValue}
                        color="#1E88E5"
                        iconBg="#E3F2FD"
                    />
                </View>
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                {isCustomDate ? 'Select Date Range' : 'Download Report'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {!isCustomDate ? (
                            <View style={styles.filterOptions}>
                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomColor: theme.colors.border }]}
                                    onPress={() => downloadReport('last_week')}
                                >
                                    <MaterialCommunityIcons name="calendar-week" size={22} color={theme.colors.primary} />
                                    <Text style={[styles.filterText, { color: theme.colors.text }]}>Last Week</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomColor: theme.colors.border }]}
                                    onPress={() => downloadReport('last_month')}
                                >
                                    <MaterialCommunityIcons name="calendar-range" size={22} color={theme.colors.primary} />
                                    <Text style={[styles.filterText, { color: theme.colors.text }]}>Last Month</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomColor: theme.colors.border }]}
                                    onPress={() => downloadReport('all')}
                                >
                                    <MaterialCommunityIcons name="calendar-check" size={22} color={theme.colors.primary} />
                                    <Text style={[styles.filterText, { color: theme.colors.text }]}>All Time</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomWidth: 0 }]}
                                    onPress={() => setIsCustomDate(true)}
                                >
                                    <MaterialCommunityIcons name="calendar-edit" size={22} color={theme.colors.primary} />
                                    <Text style={[styles.filterText, { color: theme.colors.text }]}>Custom Range</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.customDateContainer}>
                                <TouchableOpacity
                                    style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <View style={styles.dateButtonContent}>
                                        <Text style={[styles.dateButtonLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                                        <Text style={[styles.dateButtonValue, { color: theme.colors.text }]}>{startDate.toLocaleDateString('en-GB')}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                                    onPress={() => setShowEndPicker(true)}
                                >
                                    <View style={styles.dateButtonContent}>
                                        <Text style={[styles.dateButtonLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
                                        <Text style={[styles.dateButtonValue, { color: theme.colors.text }]}>{endDate.toLocaleDateString('en-GB')}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>

                                {showStartPicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display="default"
                                        onChange={onStartChange}
                                    />
                                )}

                                {showEndPicker && (
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        display="default"
                                        onChange={onEndChange}
                                    />
                                )}

                                <TouchableOpacity
                                    style={[styles.downloadButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                                    onPress={applyCustomRange}
                                >
                                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                    <Text style={styles.downloadButtonText}>Apply Range</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => downloadReport('custom', startDate, endDate)}
                                    style={[styles.downloadButton, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.primary, marginTop: 12 }]}
                                >
                                    <MaterialCommunityIcons name="download" size={20} color={theme.colors.primary} />
                                    <Text style={[styles.downloadButtonText, { color: theme.colors.primary }]}>Download PDF/Excel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setIsCustomDate(false)}
                                >
                                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.textSecondary} />
                                    <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>Back</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    downloadIconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    profitLossCard: {
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    profitLossHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profitLossTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 12,
    },
    profitLossSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    profitLossValue: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeFilterTab: {
        backgroundColor: colors.tertiary,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeFilterTabText: {
        color: '#fff',
    },

    statsGrid: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingBottom: 32,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    filterOptions: {
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterText: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        marginLeft: 16,
        fontWeight: '500',
    },
    customDateContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateButtonContent: {
        flex: 1,
    },
    dateButtonLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    dateButtonValue: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    downloadButton: {
        backgroundColor: colors.tertiary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 12,
    },
    backButtonText: {
        color: '#6B7280',
        fontSize: 15,
        marginLeft: 6,
        fontWeight: '500',
    },
});

export default ReportsScreen;