import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { useSales } from '../../context/SalesContext';
import { colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function SalesLedgerScreen() {
    const { sales, isLoading, deleteSale, loadSales } = useSales();
    const { theme } = useTheme();

    useFocusEffect(
        useCallback(() => {
            loadSales();
        }, [])
    );
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Group sales by date
    const groupedSales = useMemo(() => {
        const groups = sales.reduce((acc, sale) => {
            const dateObj = new Date(sale.date);
            const date = dateObj.toISOString().split('T')[0];

            if (!acc[date]) {
                acc[date] = {
                    date,
                    items: [],
                    total: 0
                };
            }
            acc[date].items.push(sale);
            const amount = sale.totalPrice || (sale.price * (sale.quantity || 1)) || 0;
            acc[date].total += amount;
            return acc;
        }, {});

        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sales]);

    // Set default selected date to the most recent one on load
    useEffect(() => {
        if (groupedSales.length > 0 && !selectedDate) {
            setSelectedDate(groupedSales[0].date);
        } else if (groupedSales.length === 0) {
            setSelectedDate(new Date().toISOString().split('T')[0]);
        }
    }, [groupedSales]);

    // Get the current view data (single day)
    const currentDayData = useMemo(() => {
        if (!selectedDate) return null;
        return groupedSales.find(g => g.date === selectedDate);
    }, [groupedSales, selectedDate]);

    // Formatting helper
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const SaleCard = ({ item, index }) => (
        <View style={[styles.saleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.cardContent}>
                <View style={styles.leftSection}>
                    <View style={styles.iconBadge}>
                        {item.type === 'service_sale' ? (
                            <MaterialCommunityIcons name="wrench" size={20} color={theme.colors.primary} />
                        ) : (
                            <MaterialCommunityIcons name="package-variant" size={20} color={theme.colors.success} />
                        )}
                    </View>
                    <View style={styles.detailsSection}>
                        <Text style={[styles.itemName, { color: theme.colors.text }]}>
                            {item.productName || item.serviceName}
                        </Text>
                        {item.quantity && item.type !== 'service_sale' ? (
                            <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>
                                Qty: {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                            </Text>
                        ) : (
                            <Text style={[styles.itemMeta, { color: theme.colors.primary }]}>
                                Service Charge
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.rightSection}>
                    <Text style={[styles.amountText, { color: theme.colors.text }]}>
                        ₹{(item.totalPrice || (item.price * (item.quantity || 1)) || 0).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Remove Sale',
                                'Are you sure you want to remove this sale?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Remove',
                                        style: 'destructive',
                                        onPress: () => deleteSale(item._id || item.id)
                                    }
                                ]
                            );
                        }}
                        style={styles.deleteBtn}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={18} color={theme.colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const DatePickerModal = () => (
        <Modal
            transparent={true}
            visible={showDatePicker}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.dateList}>
                        {groupedSales.map((item) => (
                            <TouchableOpacity
                                key={item.date}
                                style={[
                                    styles.dateOption,
                                    { borderBottomColor: theme.colors.border },
                                    selectedDate === item.date && { backgroundColor: theme.colors.primary + '10' }
                                ]}
                                onPress={() => {
                                    setSelectedDate(item.date);
                                    setShowDatePicker(false);
                                }}
                            >
                                <View>
                                    <Text style={[
                                        styles.dateOptionText,
                                        { color: theme.colors.text },
                                        selectedDate === item.date && { color: theme.colors.primary, fontWeight: '700' }
                                    ]}>
                                        {formatDate(item.date)}
                                    </Text>
                                    <Text style={[styles.dateOptionCount, { color: theme.colors.textSecondary }]}>
                                        {item.items.length} transaction{item.items.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                                {selectedDate === item.date && (
                                    <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={theme.dark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Sales Ledger</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                        Track your daily transactions
                    </Text>
                </View>
            </View>

            {/* Date Selector */}
            <TouchableOpacity
                style={[styles.dateSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => setShowDatePicker(true)}
            >
                <MaterialCommunityIcons name="calendar-month" size={22} color={theme.colors.primary} />
                <Text style={[styles.dateSelectorText, { color: theme.colors.text }]}>
                    {selectedDate ? formatDate(selectedDate) : 'Select Date'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <DatePickerModal />

            {!currentDayData ? (
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.colors.border} />
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No sales for this date</Text>
                    <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>
                        Select another date to view
                    </Text>
                </View>
            ) : (
                <View style={styles.contentContainer}>
                    {/* Sales List */}
                    <FlatList
                        data={currentDayData.items}
                        keyExtractor={(item) => item._id || item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <SaleCard item={item} index={index} />
                        )}
                        ListFooterComponent={() => (
                            <View style={[styles.totalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <View style={styles.totalRow}>
                                    <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
                                        Total Sales
                                    </Text>
                                    <Text style={[styles.totalAmount, { color: theme.colors.success }]}>
                                        ₹{currentDayData.total.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                                <View style={styles.summaryRow}>
                                    <MaterialCommunityIcons name="receipt" size={16} color={theme.colors.textSecondary} />
                                    <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
                                        {currentDayData.items.length} transaction{currentDayData.items.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '400',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    dateSelectorText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    saleCard: {
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsSection: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 13,
        fontWeight: '500',
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 8,
    },
    amountText: {
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    deleteBtn: {
        padding: 4,
    },
    totalCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    dateList: {
        maxHeight: 400,
    },
    dateOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    dateOptionText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateOptionCount: {
        fontSize: 13,
        fontWeight: '500',
    },
});