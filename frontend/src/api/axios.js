import axios from 'axios';

// Get API URL from environment variable or use default
// In production, set VITE_API_URL in your .env file
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000, // 30 second timeout
});

// Interceptor to attach the token from local storage
API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const { token } = JSON.parse(userInfo);
            if (token) {
                req.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error('Error parsing userInfo:', e);
        }
    }
    return req;
});

// Response interceptor for better error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;
            
            if (status === 401) {
                // Unauthorized - token expired or invalid
                localStorage.removeItem('userInfo');
                // Only redirect if not already on login/register page
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                    window.location.href = '/login';
                }
            } else if (status === 403) {
                console.error('Access denied:', data?.message);
            } else if (status === 500) {
                console.error('Server error:', data?.message);
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error: No response from server. Is the backend running?');
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default API;

