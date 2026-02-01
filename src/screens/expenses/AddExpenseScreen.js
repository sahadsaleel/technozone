import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const EXPENSE_TYPES = ['Rent', 'Salary', 'Electricity', 'Transport', 'Maintenance', 'Food', 'Bills', 'Other'];

/**
 * Screen for adding or editing an operational expense.
 */
const AddExpenseScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const editData = route.params?.expense;
    const isEditing = !!editData;

    const [amount, setAmount] = useState(editData ? editData.amount.toString() : '');
    const [selectedType, setSelectedType] = useState(editData ? editData.type : EXPENSE_TYPES[0]);
    const [description, setDescription] = useState(editData ? editData.description : '');
    const [date, setDate] = useState(editData ? new Date(editData.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTypeModalVisible, setTypeModalVisible] = useState(false);

    const validateForm = () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return false;
        }
        if (!date) {
            Alert.alert('Error', 'Please enter a date');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        const expenseData = {
            type: selectedType,
            amount: parseFloat(amount),
            description,
            date: date.toISOString(),
        };

        try {
            if (isEditing) {
                await api.put(`/expenses/${editData._id || editData.id}`, expenseData);
                Alert.alert('Success', 'Expense updated successfully');
            } else {
                await api.post('/expenses', expenseData);
                Alert.alert('Success', 'Expense added successfully');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Expense Error:', error);
            Alert.alert('Error', error.formattedMessage || `Failed to ${isEditing ? 'update' : 'add'} expense`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderTypeItem = (item) => (
        <TouchableOpacity
            key={item}
            style={[styles.typeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => {
                setSelectedType(item);
                setTypeModalVisible(false);
            }}
        >
            <View style={[
                styles.typeCardIndicator,
                { borderColor: theme.colors.border },
                selectedType === item && { backgroundColor: theme.colors.tertiary, borderColor: theme.colors.tertiary }
            ]} />
            <Text style={[
                styles.typeCardText,
                { color: theme.colors.textSecondary },
                selectedType === item && { color: theme.colors.text, fontWeight: '600' }
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
                    <ScrollView
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.colors.text }]}>{isEditing ? 'Edit Expense' : 'New Expense'}</Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{isEditing ? 'Update your' : 'Record your'} business expense</Text>
                        </View>

                        {/* Amount - Featured Input */}
                        <View style={[styles.amountSection, { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' }]}>
                            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
                            <View style={styles.amountInputWrapper}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={[styles.amountInput, { color: theme.colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            {/* Type Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Category</Text>
                                <TouchableOpacity
                                    style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                                    onPress={() => setTypeModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectorText, { color: theme.colors.text }]}>{selectedType}</Text>
                                    <Text style={[styles.selectorIcon, { color: theme.colors.textSecondary }]}>›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Date Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Date</Text>
                                <TouchableOpacity
                                    style={[styles.selector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectorText, { color: theme.colors.text }]}>
                                        {date.toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
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

                            {/* Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Description (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                                    placeholder="Add notes about this expense..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button - Fixed at Bottom */}
                    <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.colors.tertiary, shadowColor: theme.colors.tertiary }, isLoading && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>{isEditing ? 'Update Expense' : 'Add Expense'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Type Selection Modal */}
                    <Modal
                        visible={isTypeModalVisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setTypeModalVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setTypeModalVisible(false)}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                                <View style={[styles.modalHandle, { backgroundColor: theme.colors.border }]} />
                                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Category</Text>

                                <View style={styles.typeGrid}>
                                    {EXPENSE_TYPES.map(renderTypeItem)}
                                </View>

                                <TouchableOpacity
                                    style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                                    onPress={() => setTypeModalVisible(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
    },
    amountSection: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    amountLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        color: colors.error,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 40,
        fontWeight: '700',
        padding: 0,
    },
    formSection: {
        gap: 16,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    selector: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '500',
    },
    selectorIcon: {
        fontSize: 24,
        fontWeight: '300',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
    },
    saveButton: {
        backgroundColor: colors.tertiary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: colors.tertiary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: colors.textWhite,
        fontSize: 17,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 34,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    typeGrid: {
        gap: 12,
        marginBottom: 16,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    typeCardIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        marginRight: 12,
    },
    typeCardIndicatorActive: {
        backgroundColor: colors.tertiary,
        borderColor: colors.tertiary,
    },
    typeCardText: {
        fontSize: 16,
        fontWeight: '500',
    },
    typeCardTextActive: {
        fontWeight: '600',
    },
    cancelButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddExpenseScreen;