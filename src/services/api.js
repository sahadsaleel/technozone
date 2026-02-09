import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =======================================================================
// REAL WORLD APPLICATION CONFIGURATION
// =======================================================================

// This is your live backend hosted on Render.
// Every time you open the app, it will connect here automatically.
const PRODUCTION_URL = 'https://technozone-api.onrender.com';

const api = axios.create({
    baseURL: PRODUCTION_URL,
    headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'TechnoZone-App/1.0',
    },
    timeout: 60000,
});

// Request Interceptor: Centralized URL handling
api.interceptors.request.use(
    async (config) => {
        try {
            // Add the /api prefix automatically if not present
            if (!config.url.startsWith('/api')) {
                config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
            }

        } catch (error) {
            console.error('Request Error:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
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
        let errorMessage = 'An unexpected error occurred';

        if (!error.response) {
            // Network error (no response received)
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Connection timed out. Please check your internet.';
            } else {
                errorMessage = 'Network Error: Cannot connect to server. Check your tunnel or internet connection.';
            }
        } else {
            // Server responded with an error status
            errorMessage = error.response.data?.message || `Server Error (${error.response.status})`;
        }

        console.error('API Error:', {
            url: originalRequest?.url,
            status: error.response?.status,
            message: errorMessage
        });

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
