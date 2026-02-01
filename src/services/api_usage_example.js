import api, { apiService } from './api';

// Example 1: Using the default exported axios instance
const fetchUserData = async () => {
    try {
        const response = await api.get('/user/profile');
        console.log('User Data:', response.data);
    } catch (error) {
        console.error('Fetch Error:', error.formattedMessage);
    }
};

// Example 2: Using the helper methods with POST request
const loginUser = async (email, password) => {
    try {
        const response = await apiService.post('/auth/login', { email, password });

        // Assuming the response contains the token
        const { token } = response.data;

        // Save token for future requests (handled by interceptor)
        // You would typically import AsyncStorage here to save it
        // await AsyncStorage.setItem('userToken', token);

        console.log('Login Successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Login Error:', error.formattedMessage);
        throw error;
    }
};

// Example 3: Error handling usage
const updateProfile = async (newData) => {
    try {
        await api.put('/user/update', newData);
    } catch (error) {
        if (error.response?.status === 400) {
            alert('Invalid data provided');
        } else {
            alert(error.formattedMessage);
        }
    }
}
