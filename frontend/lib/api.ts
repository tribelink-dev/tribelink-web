import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message?.includes('Network')) {
      const apiUrl = API_URL;
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        apiUrl: apiUrl,
        config: error.config?.url,
        fullUrl: error.config ? `${apiUrl}${error.config.url}` : 'unknown',
        requestHeaders: error.config?.headers
      });
      console.error(`Backend server is not reachable at ${apiUrl}`);
      console.error('Make sure:');
      console.error('1. Backend server is running on port 5000');
      console.error('2. Check CORS settings in backend');
      console.error('3. Verify NEXT_PUBLIC_API_URL environment variable');
      console.error('4. Check if firewall is blocking the connection');
    }
    
    // Handle CORS errors specifically
    if (error.message?.includes('CORS') || error.message?.includes('cors')) {
      console.error('CORS Error:', {
        message: error.message,
        origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        apiUrl: API_URL
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;

