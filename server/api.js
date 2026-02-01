import axios from 'axios';

const api = axios.create({
    baseURL: 'https://YOUR-RENDER-URL.onrender.com/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
