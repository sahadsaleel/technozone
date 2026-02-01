import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
    Animated
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ServiceApi } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSales } from '../../context/SalesContext';

export default function AddServiceExpenseScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const { loadSales } = useSales();

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingServices, setIsFetchingServices] = useState(true);
    const [allServices, setAllServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const [formData, setFormData] = useState({
        expenseType: 'Parts',
        amount: '',
        relatedService: '',
        notes: ''
    });

    // Animations
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        fetchServiceSales();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    const fetchServiceSales = async () => {
        try {
            const response = await ServiceApi.getSales();
            setAllServices(response.data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setIsFetchingServices(false);
        }
    };

    const handleSearch = (text) => {
        setFormData({ ...formData, relatedService: text });
        if (text.length > 0) {
            const filtered = allServices.filter(s =>
                s.serviceName?.toLowerCase().includes(text.toLowerCase()) ||
                s.customerName?.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredServices(filtered);
            setShowResults(true);
        } else {
            setFilteredServices([]);
            setShowResults(false);
            setSelectedService(null);
        }
    };

    const selectService = (service) => {
        setSelectedService(service);
        setFormData({
            ...formData,
            relatedService: service.serviceName
        });
        setShowResults(false);
    };

    const handleSubmit = async () => {
        if (!formData.amount) {
            Alert.alert('Error', 'Please enter an Amount');
            return;
        }

        setIsLoading(true);
        try {
            await ServiceApi.addExpense({
                ...formData,
                amount: parseFloat(formData.amount),
                serviceId: selectedService ? selectedService._id : null
            });

            await loadSales();

            Alert.alert('Success', 'Service Expense Added Successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add service expense');
        } finally {
            setIsLoading(false);
        }
    };

    const TypeButton = ({ type, icon }) => (
        <TouchableOpacity
            style={[
                styles.methodButton,
                {
                    backgroundColor: formData.expenseType === type ? theme.colors.primary : theme.colors.card,
                    borderColor: formData.expenseType === type ? theme.colors.primary : theme.colors.border,
                    borderWidth: formData.expenseType === type ? 2 : 1,
                    elevation: formData.expenseType === type ? 6 : 2,
                    shadowColor: formData.expenseType === type ? theme.colors.primary : '#000',
                    shadowOpacity: formData.expenseType === type ? 0.4 : 0.1,
                }
            ]}
            activeOpacity={0.8}
            onPress={() => setFormData({ ...formData, expenseType: type })}
        >
            <MaterialCommunityIcons
                name={icon}
                size={24}
                color={formData.expenseType === type ? '#fff' : theme.colors.text}
            />
            <Text style={[
                styles.methodText,
                {
                    color: formData.expenseType === type ? '#fff' : theme.colors.text,
                    fontWeight: formData.expenseType === type ? 'bold' : '600'
                }
            ]}>{type}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
                <Animated.View style={[styles.header, { backgroundColor: theme.colors.card, opacity: fadeAnim }]}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Service Expense</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Log costs related to servicing</Text>
                </Animated.View>

                <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
                    {/* Expense Type */}
                    <Text style={[styles.label, { color: theme.colors.text }]}>Expense Type</Text>
                    <View style={styles.paymentMethods}>
                        <TypeButton type="Parts" icon="tools" />
                        <TypeButton type="Technician" icon="account-hard-hat" />
                        <TypeButton type="Other" icon="dots-horizontal" />
                    </View>

                    {/* Related Service Search */}
                    <View style={[styles.inputGroup, { zIndex: 100 }]}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Related Service</Text>
                        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.input, { flex: 1, borderWeight: 0, borderWidth: 0 }]}
                                placeholder="Search by name or customer..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={formData.relatedService}
                                onChangeText={handleSearch}
                                onFocus={() => formData.relatedService.length > 0 && setShowResults(true)}
                            />
                            {selectedService && (
                                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} style={{ marginRight: 10 }} />
                            )}
                        </View>

                        {/* Search Results Dropdown */}
                        {showResults && filteredServices.length > 0 && (
                            <View style={[styles.resultsDropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                    {filteredServices.map((service) => (
                                        <TouchableOpacity
                                            key={service._id}
                                            style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
                                            onPress={() => selectService(service)}
                                        >
                                            <View>
                                                <Text style={[styles.resultName, { color: theme.colors.text }]}>{service.serviceName}</Text>
                                                <Text style={[styles.resultCustomer, { color: theme.colors.textSecondary }]}>
                                                    Customer: {service.customerName}
                                                </Text>
                                            </View>
                                            <Text style={[styles.resultPrice, { color: theme.colors.primary }]}>₹{service.charge}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Selected Service Details Card */}
                    {selectedService && (
                        <View style={[styles.detailsCard, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                            <View style={styles.detailsHeader}>
                                <Text style={[styles.detailsTitle, { color: theme.colors.primary }]}>Linked Service Details</Text>
                                <TouchableOpacity onPress={() => setSelectedService(null)}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.danger} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Service</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{selectedService.serviceName}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Customer</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{selectedService.customerName}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Service Date</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {new Date(selectedService.date).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Charge</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.success, fontWeight: 'bold' }]}>
                                        ₹{selectedService.charge}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Amount (₹) *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.colors.card,
                                color: theme.colors.error,
                                borderColor: theme.colors.border,
                                fontWeight: 'bold',
                                fontSize: 18
                            }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={formData.amount}
                            onChangeText={(text) => setFormData({ ...formData, amount: text })}
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Notes (Optional)</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.colors.card,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                height: 80,
                                textAlignVertical: 'top',
                                paddingTop: 10
                            }]}
                            placeholder="Additional details..."
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={3}
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        />
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
                                <Text style={styles.submitButtonText}>Log Expense</Text>
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
        paddingBottom: 40,
    },
    header: {
        padding: 24,
        paddingTop: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        letterSpacing: 0.3,
    },
    form: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1.5,
        fontSize: 16,
    },
    resultsDropdown: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        zIndex: 1000,
        overflow: 'hidden'
    },
    resultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    resultCustomer: {
        fontSize: 13,
        marginTop: 2,
    },
    resultPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    detailsCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
        borderStyle: 'dashed'
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailsTitle: {
        fontSize: 13,
        fontWeight: ' bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    detailItem: {
        width: '45%',
    },
    detailLabel: {
        fontSize: 11,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    methodButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    methodText: {
        marginTop: 6,
        fontSize: 12,
    },
    submitButton: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
});
