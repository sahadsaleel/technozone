import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * Screen for recording a new daily purchase.
 * Updates stock automatically via backend.
 */
const AddPurchaseScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [products, setProducts] = useState([]);
    const [productName, setProductName] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Search state
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Fetch products for the search
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Fetch Products Error:', error);
            Alert.alert('Error', 'Failed to load products');
        }
    };

    const handleSearch = (text) => {
        setProductName(text);
        setSelectedProduct(null);
        if (text.length > 0) {
            const filtered = products.filter((p) =>
                p.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredProducts(filtered);
            setShowResults(true);
        } else {
            setFilteredProducts([]);
            setShowResults(false);
        }
    };

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setProductName(product.name);
        setShowResults(false);

        if (quantity && product.buyPrice) {
            setTotalCost((parseFloat(quantity) * product.buyPrice).toString());
        }
    };

    // Update total cost when quantity changes and product is selected
    useEffect(() => {
        if (selectedProduct && quantity && !isNaN(quantity)) {
            const calculated = (parseFloat(quantity) * selectedProduct.buyPrice).toFixed(2);
            setTotalCost(calculated.toString());
        }
    }, [quantity, selectedProduct]);

    const validateForm = () => {
        if (!selectedProduct && !productName) {
            Alert.alert('Error', 'Please enter or select a product');
            return false;
        }
        if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return false;
        }
        if (!totalCost || isNaN(totalCost) || Number(totalCost) < 0) {
            Alert.alert('Error', 'Please enter a valid total cost');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        if (!selectedProduct) {
            Alert.alert(
                'New Product?',
                'This product does not exist in your database. Would you like to create it first?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Create Product', onPress: () => navigation.navigate('AddProduct', { initialName: productName }) }
                ]
            );
            return;
        }

        setIsLoading(true);
        const purchaseData = {
            productId: selectedProduct._id,
            quantity: parseInt(quantity, 10),
            totalCost: parseFloat(totalCost),
            date: new Date().toISOString(),
        };

        try {
            await api.post('/purchases', purchaseData);
            Alert.alert('Success', 'Purchase recorded and stock updated!');
            navigation.goBack();
        } catch (error) {
            console.error('Purchase Error:', error);
            Alert.alert('Error', error.formattedMessage || 'Failed to record purchase');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={() => { setShowResults(false); Keyboard.dismiss(); }}>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="cart-plus" size={32} color={theme.colors.tertiary} />
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Record Purchase</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Add new inventory to your stock</Text>
                        </View>

                        {/* Product Card */}
                        <View style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="package-variant" size={20} color={theme.colors.textSecondary} />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Product Details</Text>
                            </View>

                            {/* Product Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Product Name</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <MaterialCommunityIcons
                                        name="magnify"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text }]}
                                        placeholder="Search or enter product name"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={productName}
                                        onChangeText={handleSearch}
                                        onFocus={() => productName.length > 0 && setShowResults(true)}
                                    />
                                    {productName.length > 0 && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setProductName('');
                                                setSelectedProduct(null);
                                                setShowResults(false);
                                            }}
                                            style={{ padding: 4 }}
                                        >
                                            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                    {selectedProduct && (
                                        <MaterialCommunityIcons
                                            name="check-circle"
                                            size={20}
                                            color="#10b981"
                                            style={styles.inputIcon}
                                        />
                                    )}
                                </View>

                                {/* Search Results Dropdown */}
                                {showResults && filteredProducts.length > 0 && (
                                    <View style={[styles.dropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                        <ScrollView
                                            style={styles.dropdownScroll}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled
                                        >
                                            {filteredProducts.map((item) => (
                                                <TouchableOpacity
                                                    key={item._id || item.id}
                                                    style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                                                    onPress={() => selectProduct(item)}
                                                >
                                                    <View style={styles.dropdownItemContent}>
                                                        <View style={[styles.productIcon, { backgroundColor: theme.colors.background }]}>
                                                            <MaterialCommunityIcons name="cube-outline" size={18} color={theme.colors.textSecondary} />
                                                        </View>
                                                        <View style={styles.dropdownInfo}>
                                                            <Text style={[styles.dropdownName, { color: theme.colors.text }]}>{item.name}</Text>
                                                            <View style={styles.dropdownMeta}>
                                                                <Text style={[styles.dropdownMetaText, { color: theme.colors.textSecondary }]}>Stock: {item.stock}</Text>
                                                                <Text style={[styles.dropdownMetaDot, { color: theme.colors.border }]}>•</Text>
                                                                <Text style={[styles.dropdownMetaText, { color: theme.colors.textSecondary }]}>₹{item.buyPrice}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Selected Product Info */}
                            {selectedProduct && (
                                <View style={[styles.selectedProductCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <View style={styles.selectedProductInfo}>
                                        <Text style={[styles.selectedProductLabel, { color: theme.colors.textSecondary }]}>Current Stock</Text>
                                        <Text style={[styles.selectedProductValue, { color: theme.colors.tertiary }]}>{selectedProduct.stock} units</Text>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                                    <View style={styles.selectedProductInfo}>
                                        <Text style={[styles.selectedProductLabel, { color: theme.colors.textSecondary }]}>Buy Price</Text>
                                        <Text style={[styles.selectedProductValue, { color: theme.colors.tertiary }]}>₹{selectedProduct.buyPrice}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Quantity Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Quantity</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <MaterialCommunityIcons
                                        name="package-variant-closed"
                                        size={20}
                                        color={theme.colors.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text }]}
                                        placeholder="Enter quantity"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>

                            {/* Total Cost Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Total Cost</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>₹</Text>
                                    <TextInput
                                        style={[styles.input, styles.inputWithCurrency, { color: theme.colors.text }]}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={totalCost}
                                        onChangeText={setTotalCost}
                                        keyboardType="numeric"
                                    />
                                </View>
                                {selectedProduct && quantity && (
                                    <View style={styles.calculationHint}>
                                        <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.textSecondary} />
                                        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                                            Auto-calculated at ₹{selectedProduct.buyPrice} per unit
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Summary Card */}
                        {selectedProduct && quantity && totalCost && (
                            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                                <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Purchase Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Product</Text>
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{selectedProduct.name}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Quantity</Text>
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{quantity} units</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Unit Price</Text>
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{selectedProduct.buyPrice}</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryTotalLabel, { color: theme.colors.text }]}>Total Cost</Text>
                                    <Text style={[styles.summaryTotalValue, { color: theme.colors.tertiary }]}>₹{totalCost}</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Save Button - Fixed at bottom */}
                    <View style={[styles.buttonContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.colors.tertiary, shadowColor: theme.colors.tertiary }, isLoading && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check-all" size={22} color="#fff" />
                                    <Text style={styles.saveButtonText}>Record Purchase</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 0,
    },
    inputWithCurrency: {
        paddingLeft: 4,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    dropdown: {
        marginTop: 8,
        borderRadius: 12,
        maxHeight: 240,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownScroll: {
        maxHeight: 240,
    },
    dropdownItem: {
        borderBottomWidth: 1,
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    productIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    dropdownInfo: {
        flex: 1,
    },
    dropdownName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    dropdownMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownMetaText: {
        fontSize: 13,
    },
    dropdownMetaDot: {
        fontSize: 13,
        marginHorizontal: 6,
    },
    selectedProductCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    selectedProductInfo: {
        flex: 1,
        alignItems: 'center',
    },
    selectedProductLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    selectedProductValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.tertiary,
    },
    divider: {
        width: 1,
        marginHorizontal: 16,
    },
    calculationHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingLeft: 4,
    },
    hintText: {
        fontSize: 12,
        marginLeft: 6,
        fontStyle: 'italic',
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    summaryDivider: {
        height: 1,
        marginVertical: 8,
    },
    summaryTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    summaryTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.tertiary,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButton: {
        backgroundColor: colors.tertiary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default AddPurchaseScreen;