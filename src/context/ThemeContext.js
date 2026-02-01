import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', 'system'
    const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('themePreference');
            const savedFontSize = await AsyncStorage.getItem('fontSize');
            if (savedTheme) setThemePreference(savedTheme);
            if (savedFontSize) setFontSize(savedFontSize);
        } catch (e) {
            console.error('Failed to load theme preferences', e);
        }
    };

    const updateTheme = async (newTheme) => {
        try {
            setThemePreference(newTheme);
            await AsyncStorage.setItem('themePreference', newTheme);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const updateFontSize = async (newSize) => {
        try {
            setFontSize(newSize);
            await AsyncStorage.setItem('fontSize', newSize);
        } catch (e) {
            console.error('Failed to save font size', e);
        }
    };

    // Derived theme based on preference and system setting
    const activeTheme = themePreference === 'system' ? systemScheme : themePreference;
    const isDark = activeTheme === 'dark';

    const theme = {
        dark: isDark,
        colors: {
            background: isDark ? '#121212' : '#FAFAFA',
            card: isDark ? '#1E1E1E' : '#FFFFFF',
            text: isDark ? '#FFFFFF' : '#000000',
            textSecondary: isDark ? '#A0A0A0' : '#666666',
            border: isDark ? '#333333' : '#E0E0E0',
            primary: '#007AFF', // Blue
            secondary: '#5856D6', // Purple
            tertiary: '#007AFF', // Blue (Same as primary for consistency in buttons)
            surface: isDark ? '#1E1E1E' : '#FFFFFF',
            danger: '#FF3B30',
            success: '#34C759',
            warning: '#FFCC00',
            info: '#007AFF',
        },
        fontScale: fontSize === 'small' ? 0.8 : fontSize === 'large' ? 1.2 : 1,
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            themePreference,
            updateTheme,
            fontSize,
            updateFontSize
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
