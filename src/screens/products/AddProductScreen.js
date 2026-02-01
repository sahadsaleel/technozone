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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

/**
 * Screen for adding or editing a product.
 * Handles form validation and API requests.
 */
const AddProductScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [stock, setStock] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [productId, setProductId] = useState(null);

    useEffect(() => {
        if (route.params?.product) {
            const { product } = route.params;
            setName(product.name);
            setBuyPrice(product.buyPrice.toString());
            setSellPrice(product.sellPrice.toString());
            setStock(product.stock.toString());
            setProductId(product._id);
            setIsEditing(true);
            navigation.setOptions({ title: 'Edit Product' });
        } else if (route.params?.initialName) {
            setName(route.params.initialName);
        }
    }, [route.params, navigation]);

    const validateForm = () => {
        if (!name || !buyPrice || !sellPrice || !stock) {
            Alert.alert('Error', 'All fields are required');
            return false;
        }
        if (isNaN(buyPrice) || isNaN(sellPrice) || isNaN(stock)) {
            Alert.alert('Error', 'Price and Stock must be valid numbers');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        const productData = {
            name,
            buyPrice: parseFloat(buyPrice),
            sellPrice: parseFloat(sellPrice),
            stock: parseInt(stock, 10),
        };

        try {
            if (isEditing) {
                await api.put(`/products/${productId}`, productData);
                Alert.alert('Success', 'Product updated successfully');
            } else {
                await api.post('/products', productData);
                Alert.alert('Success', 'Product added successfully');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Save Error:', error);
            Alert.alert('Error', error.formattedMessage || 'Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        {isEditing ? 'Edit Product' : 'New Product'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                        {isEditing ? 'Update product details' : 'Fill in the product information'}
                    </Text>
                </View>

                {/* Form Card */}
                <View style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                    {/* Product Name */}
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Product Name</Text>
                        <TextInput
                            style={[styles.input, {
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                                backgroundColor: theme.colors.background
                            }]}
                            placeholder="Enter product name"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Pricing Section */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Pricing</Text>
                        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInputWrapper}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Buy Price</Text>
                            <View style={[styles.priceInputContainer, {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background
                            }]}>
                                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>₹</Text>
                                <TextInput
                                    style={[styles.priceInput, { color: theme.colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={buyPrice}
                                    onChangeText={setBuyPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.halfInputWrapper}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Sell Price</Text>
                            <View style={[styles.priceInputContainer, {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background
                            }]}>
                                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>₹</Text>
                                <TextInput
                                    style={[styles.priceInput, { color: theme.colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={sellPrice}
                                    onChangeText={setSellPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Profit Indicator */}
                    {buyPrice && sellPrice && !isNaN(buyPrice) && !isNaN(sellPrice) && (
                        <View style={[styles.profitIndicator, {
                            backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#F0F9FF',
                            borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#E0F2FE',
                            borderWidth: 1
                        }]}>
                            <Text style={[styles.profitLabel, { color: theme.colors.textSecondary }]}>Profit Margin:</Text>
                            <Text style={[
                                styles.profitValue,
                                parseFloat(sellPrice) > parseFloat(buyPrice)
                                    ? { color: theme.colors.success }
                                    : { color: theme.colors.danger }
                            ]}>
                                ₹{(parseFloat(sellPrice) - parseFloat(buyPrice)).toFixed(2)}
                            </Text>
                        </View>
                    )}

                    {/* Stock Section */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Inventory</Text>
                        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Stock Quantity</Text>
                        <TextInput
                            style={[styles.input, {
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                                backgroundColor: theme.colors.background
                            }]}
                            placeholder="0"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={stock}
                            onChangeText={setStock}
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                        onPress={handleSave}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.saveButtonText}>
                                    {isEditing ? 'Update Product' : 'Add Product'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text || '#1a1a1a',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 15,
        color: colors.textSecondary || '#666',
        fontWeight: '400',
    },
    card: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    halfInputWrapper: {
        flex: 1,
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text || '#1a1a1a',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingLeft: 14,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 6,
    },
    priceInput: {
        flex: 1,
        padding: 14,
        paddingLeft: 0,
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    sectionDivider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border || '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary || '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 12,
    },
    profitIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface || '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    profitLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary || '#666',
    },
    profitValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    profitPositive: {
        color: '#10b981',
    },
    profitNegative: {
        color: '#ef4444',
    },
    buttonContainer: {
        gap: 12,
    },
    saveButton: {
        backgroundColor: colors.tertiary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        minHeight: 52,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.border || '#e0e0e0',
    },
    cancelButtonText: {
        color: colors.textSecondary || '#666',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default AddProductScreen;