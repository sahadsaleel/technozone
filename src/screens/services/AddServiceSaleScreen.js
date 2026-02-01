import React, { useState } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ServiceApi } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSales } from '../../context/SalesContext';

export default function AddServiceSaleScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const { loadSales } = useSales();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        serviceName: '',
        customerName: '',
        charge: '',
        cost: '',
        paymentMethod: 'Cash',
        notes: ''
    });

    const handleSubmit = async () => {
        if (!formData.serviceName || !formData.charge) {
            Alert.alert('Error', 'Please fill in Service Name and Charge amount');
            return;
        }

        setIsLoading(true);
        try {
            await ServiceApi.addSale({
                ...formData,
                charge: parseFloat(formData.charge),
                cost: formData.cost ? parseFloat(formData.cost) : 0
            });

            // Refresh the ledger data
            await loadSales();

            Alert.alert('Success', 'Service Sale Added Successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add service sale');
        } finally {
            setIsLoading(false);
        }
    };

    const PaymentMethodButton = ({ method, icon }) => (
        <TouchableOpacity
            style={[
                styles.methodButton,
                {
                    backgroundColor: formData.paymentMethod === method ? theme.colors.primary : theme.colors.card,
                    borderColor: formData.paymentMethod === method ? theme.colors.primary : theme.colors.border,
                    borderWidth: formData.paymentMethod === method ? 2 : 1,
                    elevation: formData.paymentMethod === method ? 6 : 2,
                    shadowColor: formData.paymentMethod === method ? theme.colors.primary : '#000',
                    shadowOpacity: formData.paymentMethod === method ? 0.4 : 0.1,
                    transform: [{ scale: formData.paymentMethod === method ? 1.05 : 1 }]
                }
            ]}
            activeOpacity={0.8}
            onPress={() => setFormData({ ...formData, paymentMethod: method })}
        >
            <MaterialCommunityIcons
                name={icon}
                size={24}
                color={formData.paymentMethod === method ? '#fff' : theme.colors.text}
            />
            <Text style={[
                styles.methodText,
                {
                    color: formData.paymentMethod === method ? '#fff' : theme.colors.text,
                    fontWeight: formData.paymentMethod === method ? 'bold' : '600'
                }
            ]}>{method}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>New Service Sale</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Enter service details</Text>
                </View>

                <View style={styles.form}>
                    {/* Service Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Service Name *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.colors.card,
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }]}
                            placeholder="Ex: Screen Replacement"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={formData.serviceName}
                            onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
                        />
                    </View>

                    {/* Customer Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Customer Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.colors.card,
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }]}
                            placeholder="Customer Name (Optional)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={formData.customerName}
                            onChangeText={(text) => setFormData({ ...formData, customerName: text })}
                        />
                    </View>

                    {/* Charge Amount */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Service Charge (₹) *</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.colors.card,
                                    color: theme.colors.success,
                                    borderColor: theme.colors.border,
                                    fontWeight: 'bold',
                                    fontSize: 18
                                }]}
                                placeholder="0.00"
                                placeholderTextColor={theme.colors.textSecondary}
                                keyboardType="numeric"
                                value={formData.charge}
                                onChangeText={(text) => setFormData({ ...formData, charge: text })}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Service Cost (₹)</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.colors.card,
                                    color: theme.colors.error,
                                    borderColor: theme.colors.border
                                }]}
                                placeholder="Cost (Parts etc.)"
                                placeholderTextColor={theme.colors.textSecondary}
                                keyboardType="numeric"
                                value={formData.cost}
                                onChangeText={(text) => setFormData({ ...formData, cost: text })}
                            />
                            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Optional: Expense incurred</Text>
                        </View>
                    </View>

                    {/* Payment Method */}
                    <Text style={[styles.label, { color: theme.colors.text, marginTop: 10 }]}>Payment Method</Text>
                    <View style={styles.paymentMethods}>
                        <PaymentMethodButton method="Cash" icon="cash" />
                        <PaymentMethodButton method="UPI" icon="qrcode" />
                        <PaymentMethodButton method="Card" icon="credit-card" />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="content-save-outline" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>Save Service Sale</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
    },
    form: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    hint: {
        fontSize: 12,
        marginTop: 5,
        fontStyle: 'italic',
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    methodButton: {
        flex: 1,
        marginHorizontal: 5,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    methodText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '600',
    },
    submitButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});
