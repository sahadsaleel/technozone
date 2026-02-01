import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ProductListScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setFilteredProducts(response.data);
            setSearchQuery(''); // Reset search on fresh fetch
        } catch (error) {
            console.error('Fetch Error:', error);
            Alert.alert('Error', 'Failed to fetch products');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    // Handle real-time search filtering
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(query)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/products/${id}`);
                            const updatedProducts = products.filter((item) => item._id !== id);
                            setProducts(updatedProducts);
                            Alert.alert('Success', 'Product deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddProduct', { product: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={[styles.stockBadge, {
                    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#E0F2FE'
                }]}>
                    <Text style={[styles.stockText, { color: theme.colors.primary }]}>{item.stock}</Text>
                </View>
            </View>

            <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                    <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Buy Price</Text>
                    <Text style={[styles.priceValue, { color: theme.colors.text }]}>₹{item.buyPrice}</Text>
                </View>
                <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.priceItem}>
                    <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Sell Price</Text>
                    <Text style={[styles.priceValue, { color: theme.colors.text }]}>₹{item.sellPrice}</Text>
                </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddProduct', { product: item })}
                    style={[styles.iconButton, { backgroundColor: theme.colors.background }]}
                    activeOpacity={0.6}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    style={[styles.iconButton, { backgroundColor: theme.colors.background }]}
                    activeOpacity={0.6}
                >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !isRefreshing) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.searchSection, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Search products..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item._id || item.id}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        {renderItem({ item })}
                    </View>
                ).props.children}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons
                            name="package-variant"
                            size={64}
                            color={theme.colors.textSecondary}
                            style={styles.emptyIcon}
                        />
                        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                            {searchQuery ? 'No matching products' : 'No products yet'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            {searchQuery
                                ? 'Try searching with a different name'
                                : 'Tap the + button to add your first product'}
                        </Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddProduct')}
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
        backgroundColor: '#F8F9FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 90,
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        marginLeft: 8,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 12,
    },
    stockBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 50,
        alignItems: 'center',
    },
    stockText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.tertiary,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 8,
    },
    priceItem: {
        flex: 1,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    priceDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
        marginTop: 4,
    },
    iconButton: {
        padding: 8,
        marginLeft: 12,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.tertiary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        opacity: 0.3,
        marginBottom: 16,
    },
    emptyText: {
        color: '#1A1A1A',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default ProductListScreen;