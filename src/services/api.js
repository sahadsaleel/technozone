import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL configuration
// For physical devices, use your computer's LAN IP
// For Android Emulator, use http://10.0.2.2:5000/api
// For iOS Simulator/Web, use http://localhost:5000/api

// UPDATED PUBLIC IP: 223.181.12.52
// NOTE: PORT FORWARDING (5000) MUST BE ENABLED ON ROUTER
const BASE_URL = 'http://223.181.12.52:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        // Bypass tunnel landing pages (localtunnel & ngrok)
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'TechnoZone-App',
    },
    timeout: 60000, // Increased to 60s for slow tunnels
});

// Request Interceptor: Add JWT Token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (optional: Logout user or refresh token)
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access - potential logout trigger');
            // Here you could dispatch a logout action or clear storage
            // await AsyncStorage.removeItem('userToken');
        }

        // Format error message for easier consumption in UI
        const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'An unexpected error occurred';

        // Attach formatted message to the error object
        error.formattedMessage = errorMessage;

        return Promise.reject(error);
    }
);

/**
 * Generic API methods helper (optional usage)
 */
export const apiService = {
    get: (url, params) => api.get(url, { params }),
    post: (url, data) => api.post(url, data),
    put: (url, data) => api.put(url, data),
    delete: (url) => api.delete(url),
};

export const ServiceApi = {
    addSale: (data) => api.post('/services/sales', data),
    getSales: () => api.get('/services/sales'),
    addExpense: (data) => api.post('/services/expenses', data),
    getExpenses: () => api.get('/services/expenses'),
};

export default api;
