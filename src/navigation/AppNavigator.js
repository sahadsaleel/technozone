import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { SalesProvider } from '../context/SalesContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import AddProductScreen from '../screens/products/AddProductScreen';
import AddPurchaseScreen from '../screens/purchases/AddPurchaseScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import AddSaleScreen from '../screens/sales/AddSaleScreen';
import SalesLedgerScreen from '../screens/sales/SalesLedgerScreen';
import AddServiceSaleScreen from '../screens/services/AddServiceSaleScreen';
import AddServiceExpenseScreen from '../screens/services/AddServiceExpenseScreen';

import SignupScreen from '../screens/auth/SignupScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

function AppStack() {
    const { userToken, isLoading } = useAuth();
    const { theme } = useTheme();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.card,
                    borderBottomWidth: theme.dark ? 1 : 0,
                    borderBottomColor: theme.colors.border,
                    elevation: theme.dark ? 0 : 4,
                    shadowOpacity: theme.dark ? 0 : 0.1,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                cardStyle: { backgroundColor: theme.colors.background }
            }}
        >
            {userToken == null ? (
                // No token found, user isn't signed in
                <>
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Signup"
                        component={SignupScreen}
                        options={{ headerShown: false }}
                    />
                </>
            ) : (
                // User is signed in
                <>
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ title: 'Dashboard' }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{ title: 'Settings' }}
                    />
                </>
            )}
            <Stack.Screen
                name="ProductList"
                component={ProductListScreen}
                options={{ title: 'Products' }}
            />
            <Stack.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ title: 'Add Product' }}
            />
            <Stack.Screen
                name="AddPurchase"
                component={AddPurchaseScreen}
                options={{ title: 'Daily Purchase' }}
            />
            <Stack.Screen
                name="ExpenseList"
                component={ExpenseListScreen}
                options={{ title: 'Expenses' }}
            />
            <Stack.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{ title: 'Add Expense' }}
            />
            <Stack.Screen
                name="Reports"
                component={ReportsScreen}
                options={{ title: 'Financial Reports' }}
            />
            <Stack.Screen
                name="AddSale"
                component={AddSaleScreen}
                options={{ title: 'Add Sale' }}
            />
            <Stack.Screen
                name="SalesLedger"
                component={SalesLedgerScreen}
                options={{ title: 'Sales Ledger' }}
            />
            <Stack.Screen
                name="AddServiceSale"
                component={AddServiceSaleScreen}
                options={{ title: 'Add Service Sale' }}
            />
            <Stack.Screen
                name="AddServiceExpense"
                component={AddServiceExpenseScreen}
                options={{ title: 'Add Service Expense' }}
            />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <AuthProvider>
            <SalesProvider>
                <ThemeProvider>
                    <NavigationContainer>
                        <AppStack />
                    </NavigationContainer>
                </ThemeProvider>
            </SalesProvider>
        </AuthProvider>
    );
}
