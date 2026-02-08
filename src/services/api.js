import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =======================================================================
// REAL WORLD APPLICATION CONFIGURATION
// =======================================================================

// 1. PRODUCTION_URL: This is your "Real World" hosted backend.
//    - If you deploy to Render, verify the URL here.
//    - Example: 'https://technozone-api.onrender.com'
const PRODUCTION_URL = 'https://technozone-api.onrender.com'; // <--- UPDATE THIS WITH YOUR RENDER URL

// 2. LOCAL_URL: For testing on your computer/simulator
const LOCAL_URL = 'http://192.168.1.4:5000'; // Check your IP with 'ipconfig'

// 3. USE_PRODUCTION: Set to true when building the APK for your phone!
//    Set to false when just coding on your laptop.
const USE_PRODUCTION = true;

const BASE_URL = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

console.log(`🚀 API Initialized using: ${BASE_URL} (${USE_PRODUCTION ? 'Production' : 'Development'})`);

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true', // Needed for localtunnel
        'ngrok-skip-browser-warning': 'true', // Needed for ngrok
        'User-Agent': 'TechnoZone-App/1.0',
    },
    timeout: 60000, // Increased to 60s to handle Render free tier "cold starts"
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
