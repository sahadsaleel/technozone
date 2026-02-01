import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
    const { logout, userData } = useAuth();
    const { theme } = useTheme();
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalExpenses: 0,
        totalProducts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSummary = async () => {
        try {
            const response = await api.get('/dashboard/summary?filter=today');
            setSummary(response.data);
        } catch (error) {
            console.error('Fetch Dashboard Error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchSummary();
        }, [])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchSummary();
    };

    const navItems = [
        { title: 'Sales', route: 'SalesLedger', icon: 'book-open-variant', color: '#4A90E2' },
        { title: 'Add Sale', route: 'AddSale', icon: 'plus-circle', color: '#50C878' },
        { title: 'Products', route: 'ProductList', icon: 'package-variant', color: '#9B59B6' },
        { title: 'Purchase', route: 'AddPurchase', icon: 'cart', color: '#FF6B6B' },
        { title: 'Expenses', route: 'ExpenseList', icon: 'wallet', color: '#F39C12' },
        { title: 'Reports', route: 'Reports', icon: 'chart-line', color: '#1ABC9C' },
        { title: 'Service Sale', route: 'AddServiceSale', icon: 'wrench', color: '#E74C3C' },
        { title: 'Service Exp', route: 'AddServiceExpense', icon: 'tools', color: '#34495E' },
    ];

    const StatCard = ({ title, value, icon, color, isProduct }) => (
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconCircle, { backgroundColor: color + '15' }]}>
                    <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {isProduct ? value : `₹${value.toLocaleString('en-IN')}`}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <StatusBar
                barStyle={theme.dark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Good day</Text>
                            <Text style={[styles.userName, { color: theme.colors.text }]}>{userData?.name || 'Shop Owner'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert('Logout', 'Are you sure you want to logout?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', onPress: logout, style: 'destructive' }
                                ]);
                            }}
                            style={styles.headerLogoutBtn}
                        >
                            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={[styles.statsSection, { backgroundColor: theme.dark ? '#1A1A1A' : '#F8F9FA' }]}>
                    <View style={styles.statsRow}>
                        <View style={styles.statsColumn}>
                            <StatCard
                                title="Today's Sales"
                                value={summary.totalSales}
                                icon="trending-up"
                                color="#50C878"
                            />
                        </View>
                        <View style={styles.statsColumn}>
                            <StatCard
                                title="Today's Expenses"
                                value={summary.totalExpenses}
                                icon="trending-down"
                                color="#FF6B6B"
                            />
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statsColumn}>
                            <StatCard
                                title="Products"
                                value={summary.totalProducts}
                                icon="package-variant"
                                color="#9B59B6"
                                isProduct
                            />
                        </View>
                        {/* Empty column for layout balance if needed, or we can use a full width card */}
                        <View style={styles.statsColumn} />
                    </View>
                </View>

                {/* Actions Grid */}
                <View style={[styles.actionsSection, { backgroundColor: theme.dark ? '#1A1A1A' : '#F8F9FA' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        {navItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionCard}
                                onPress={() => navigation.navigate(item.route)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: theme.colors.card }]}>
                                    <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
                                </View>
                                <Text style={[styles.actionTitle, { color: theme.colors.textSecondary }]}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Settings Action at Bottom */}
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.logoutRow, { backgroundColor: theme.colors.card }]}>
                    <View style={[styles.logoutIconContainer, { backgroundColor: theme.dark ? '#333' : '#64748B10' }]}>
                        <MaterialCommunityIcons name="cog" size={22} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.logoutText, { color: theme.colors.textSecondary }]}>Settings</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.border} />
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 8,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLogoutBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    greeting: {
        fontSize: 16,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    userName: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -1,
    },
    statsSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    statsColumn: {
        flex: 1,
    },
    statCard: {
        borderRadius: 20,
        padding: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statTitle: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    actionsSection: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    actionCard: {
        width: '33.33%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    actionIcon: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    logoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoutText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginBottom: 40,
    },
});
