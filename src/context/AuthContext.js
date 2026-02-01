import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if a token exists in storage when the app loads
        const bootstrapAsync = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const user = await AsyncStorage.getItem('userData');
                if (token) setUserToken(token);
                if (user) setUserData(JSON.parse(user));
            } catch (e) {
                console.error('Failed to load auth data', e);
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            setUserToken(token);
            setUserData(user);
            return true;
        } catch (error) {
            console.error('Login Error:', error);
            const message = error.response?.data?.message || error.message || 'Login failed';
            alert(message);
            return false;
        }
    };

    const signup = async (username, email, password) => {
        try {
            const response = await api.post('/auth/register', {
                name: username,
                email,
                password
            });
            const { token } = response.data;

            // On successful registration, we might want to auto-login or just redirect
            alert('Signup successful! Please login.');
            return true;
        } catch (error) {
            console.error('Signup Error:', error);
            // Check if it's a network error (no response)
            if (!error.response) {
                alert('Network Error: Could not connect to server. Check your internet connection and IP address configuration.');
            } else {
                const message = error.response?.data?.message || 'Signup failed';
                alert(message);
            }
            return false;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, userData, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
