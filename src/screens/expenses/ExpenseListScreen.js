import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ExpenseListScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [expenses, setExpenses] = useState([]);
    const [filterType, setFilterType] = useState('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/expenses', {
                params: { view: filterType }
            });
            setExpenses(response.data);
        } catch (error) {
            console.error('Fetch Expenses Error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchExpenses();
        }, [filterType])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchExpenses();
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/expenses/${id}`);
                            fetchExpenses();
                        } catch (error) {
                            console.error('Delete Expense Error:', error);
                            Alert.alert('Error', 'Failed to delete expense');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (expense) => {
        navigation.navigate('AddExpense', { expense });
    };

    const getExpenseIcon = (type) => {
        const iconMap = {
            'Rent': 'home-city',
            'Salary': 'account-cash',
            'Electricity': 'lightning-bolt',
            'Transport': 'truck-delivery',
            'Maintenance': 'wrench',
            'Food': 'food',
            'Bills': 'file-document-outline',
            'Other': 'dots-horizontal',
        };
        return iconMap[type] || 'cash';
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {/* Navigate to expense detail if needed */ }}
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <MaterialCommunityIcons
                        name={getExpenseIcon(item.type)}
                        size={24}
                        color={theme.colors.primary}
                    />
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={[styles.type, { color: theme.colors.text }]}>{item.type}</Text>
                    <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                    {item.description ? (
                        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {item.description}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: theme.colors.danger }]}>₹{item.amount}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => handleEdit(item)}
                            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
                        >
                            <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item._id || item.id)}
                            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
                        >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const getTotalExpenses = () => {
        return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header Section */}
            <View style={[styles.header, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Expenses</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                    Track your spending
                </Text>
            </View>

            {/* Filter Tabs */}
            <View style={[styles.filterContainer, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity
                    style={[styles.filterButton, filterType === 'daily' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilterType('daily')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.filterText, { color: theme.colors.textSecondary }, filterType === 'daily' && styles.activeFilterText]}>
                        Daily
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterType === 'monthly' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilterType('monthly')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.filterText, { color: theme.colors.textSecondary }, filterType === 'monthly' && styles.activeFilterText]}>
                        Monthly
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Total Summary Card */}
            {!isLoading && expenses.length > 0 && (
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}>
                    <Text style={styles.summaryLabel}>Total {filterType} expenses</Text>
                    <Text style={styles.summaryAmount}>₹{getTotalExpenses().toFixed(2)}</Text>
                </View>
            )}

            {/* Content */}
            {isLoading && !isRefreshing ? (
                <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
                            {renderItem({ item })}
                        </View>
                    ).props.children}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons
                                name="wallet-outline"
                                size={64}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No expenses yet</Text>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Start tracking your expenses by tapping the + button
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB to Add Expense */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddExpense')}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeFilter: {
        backgroundColor: colors.tertiary,
    },
    filterText: {
        fontWeight: '600',
        fontSize: 14,
    },
    activeFilterText: {
        color: colors.textWhite,
    },
    summaryCard: {
        backgroundColor: colors.tertiary,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 3,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.textWhite,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    type: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        marginTop: 2,
    },
    amountContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.error,
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 4,
        marginLeft: 12,
        borderRadius: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.tertiary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
});

export default ExpenseListScreen;