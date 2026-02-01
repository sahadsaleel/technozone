import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSales } from '../../context/SalesContext';
import { colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AddSaleScreen({ navigation }) {
    const { theme } = useTheme();
    const { addSale } = useSales();
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [unitPrice, setUnitPrice] = useState(0);
    const [quantity, setQuantity] = useState('1');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Auto-update total price when quantity or unitPrice changes
    useEffect(() => {
        if (unitPrice && quantity && !isNaN(quantity)) {
            const total = (unitPrice * parseInt(quantity)).toFixed(2);
            setPrice(total.toString());
        }
    }, [quantity, unitPrice]);

    // Product Search State
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setAllProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleSearch = (text) => {
        setProductName(text);
        setSelectedProduct(null);
        if (text.length > 0) {
            const filtered = allProducts.filter((p) =>
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
        if (product.stock <= 0) {
            Alert.alert('Out of Stock', `${product.name} is currently out of stock. You cannot sell this item.`);
            return;
        }
        setProductName(product.name);
        setUnitPrice(product.sellPrice);
        setSelectedProduct(product);
        setShowResults(false);
    };

    const handleAddSale = async () => {
        if (!productName || !price || !date || !quantity) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (selectedProduct && selectedProduct.stock <= 0) {
            Alert.alert('Out of Stock', 'Cannot record sale for an out-of-stock product.');
            return;
        }

        if (selectedProduct && parseInt(quantity) > selectedProduct.stock) {
            Alert.alert('Insufficient Stock', `Only ${selectedProduct.stock} units available.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const saleResult = await addSale({
                productName,
                productId: selectedProduct ? (selectedProduct._id || selectedProduct.id) : null,
                quantity: parseInt(quantity),
                unitPrice: parseFloat(price) / (parseInt(quantity) || 1),
                totalPrice: parseFloat(price),
                date: date.toISOString().split('T')[0],
            });

            if (!saleResult.success) throw new Error('Failed to save to ledger');

            if (selectedProduct) {
                await api.put(`/products/${selectedProduct._id}/decrease-stock`, {
                    quantity: parseInt(quantity)
                });
            }

            Alert.alert('Success', 'Sale recorded successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Add Sale Error:', error);
            Alert.alert('Error', 'Failed to complete sale');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: theme.colors.background }}
            >
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Sale</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Record your transaction</Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.formCard,
                        {
                            backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000',
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Product Search */}
                    <View style={[styles.fieldWrapper, { zIndex: 100 }]}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Product</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <MaterialCommunityIcons
                                name="magnify"
                                size={20}
                                color={theme.colors.textSecondary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.textInput, { color: theme.colors.text }]}
                                placeholder="Search product..."
                                value={productName}
                                onChangeText={handleSearch}
                                onFocus={() => productName.length > 0 && setShowResults(true)}
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                            {productName.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setProductName('');
                                        setSelectedProduct(null);
                                        setShowResults(false);
                                    }}
                                    style={styles.clearButton}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            {selectedProduct && (
                                <View style={styles.selectedBadge}>
                                    <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                                </View>
                            )}
                        </View>

                        {showResults && filteredProducts.length > 0 && (
                            <View style={[styles.dropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <ScrollView
                                    style={styles.dropdownScroll}
                                    keyboardShouldPersistTaps="always"
                                    nestedScrollEnabled={true}
                                >
                                    {filteredProducts.map((item, index) => (
                                        <TouchableOpacity
                                            key={item._id || item.id}
                                            style={[
                                                styles.dropdownItem,
                                                { borderBottomColor: theme.colors.border },
                                                item.stock <= 0 && { backgroundColor: theme.colors.background, opacity: 0.5 },
                                                index === filteredProducts.length - 1 && styles.dropdownItemLast
                                            ]}
                                            onPress={() => selectProduct(item)}
                                            disabled={item.stock <= 0}
                                        >
                                            <View style={styles.dropdownItemContent}>
                                                <Text style={[
                                                    styles.dropdownItemName,
                                                    { color: theme.colors.text },
                                                    item.stock <= 0 && { color: theme.colors.textSecondary }
                                                ]}>
                                                    {item.name}
                                                </Text>
                                                <Text style={[
                                                    styles.dropdownItemStock,
                                                    item.stock <= 0 ? { color: theme.colors.danger } : { color: theme.colors.success }
                                                ]}>
                                                    {item.stock <= 0 ? 'Out of stock' : `${item.stock} in stock`}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.dropdownItemPrice,
                                                { color: theme.colors.text },
                                                item.stock <= 0 && { color: theme.colors.textSecondary }
                                            ]}>
                                                ₹{item.sellPrice}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Quantity and Price Row */}
                    <View style={[styles.fieldRow, { zIndex: 1 }]}>
                        <View style={[styles.fieldWrapper, styles.fieldHalf]}>
                            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Quantity</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                <TextInput
                                    style={[styles.textInput, { color: theme.colors.text }]}
                                    placeholder="1"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="number-pad"
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={[styles.fieldWrapper, styles.fieldHalf]}>
                            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Total Price</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>₹</Text>
                                <TextInput
                                    style={[styles.textInput, styles.priceInput, { color: theme.colors.text }]}
                                    placeholder="0.00"
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Date */}
                    <View style={styles.fieldWrapper}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Date</Text>
                        <TouchableOpacity
                            style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialCommunityIcons
                                name="calendar"
                                size={20}
                                color={theme.colors.primary}
                                style={styles.inputIcon}
                            />
                            <Text style={[styles.textInput, { color: theme.colors.text }]}>
                                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setDate(selectedDate);
                            }}
                        />
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleAddSale}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <Text style={styles.submitButtonText}>Recording...</Text>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-all" size={22} color="#fff" />
                                <Text style={styles.submitButtonText}>Confirm Sale</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
        fontWeight: '400',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
    },
    fieldWrapper: {
        marginBottom: 24,
    },
    fieldRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    fieldHalf: {
        flex: 1,
        marginBottom: 0,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 10,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e9ecef',
        paddingHorizontal: 14,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
        textAlignVertical: 'center',
    },
    priceInput: {
        paddingLeft: 4,
    },
    currencySymbol: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
        marginRight: 4,
    },
    selectedBadge: {
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
        marginHorizontal: 4,
    },
    dropdown: {
        position: 'absolute',
        top: 84,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 240,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 12,
        zIndex: 1000,
    },
    dropdownScroll: {
        paddingVertical: 4,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    dropdownItemLast: {
        borderBottomWidth: 0,
    },
    dropdownItemDisabled: {
        opacity: 0.5,
        backgroundColor: '#fafafa',
    },
    dropdownItemContent: {
        flex: 1,
    },
    dropdownItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    dropdownItemStock: {
        fontSize: 13,
        color: '#10b981',
        fontWeight: '500',
    },
    outOfStockText: {
        color: '#ef4444',
    },
    disabledText: {
        color: '#999',
    },
    dropdownItemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 12,
    },

    submitButton: {
        backgroundColor: colors.tertiary,
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});