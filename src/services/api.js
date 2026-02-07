import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BASE_URL Configuration
// For Local Development (Simulator): http://192.168.1.4:5000
// For Production/APK (Public Tunnel): https://technozone-server.loca.lt (Example)
// IMPORTANT: Update this URL after starting 'npm run tunnel'
const BASE_URL = 'https://bitter-readers-cheat.loca.lt';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'TechnoZone-App',
    },
    timeout: 30000,
});

// Request Interceptor: Centralized URL handling
api.interceptors.request.use(
    async (config) => {
        try {
            // Ensure all requests go through the /api prefix
            if (!config.url.startsWith('/api')) {
                config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
            }

        } catch (error) {
            console.error('Error in request interceptor:', error);
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
