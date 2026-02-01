const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

const testAuth = async () => {
    try {
        console.log('Testing Registration...');
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post(`${API_URL}/register`, {
            name: 'Test User',
            email: uniqueEmail,
            password: 'password123'
        });
        console.log('Register Success:', registerRes.data);

        console.log('Testing Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: uniqueEmail,
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data);

    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.data);
            console.error('Status:', error.response.status);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testAuth();
