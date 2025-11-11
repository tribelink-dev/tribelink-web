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
    // Enhanced error logging
    const apiUrl = API_URL;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      apiUrl: apiUrl,
      currentOrigin: currentOrigin,
      requestUrl: error.config?.url,
      fullUrl: error.config ? `${apiUrl}${error.config.url}` : 'unknown',
      requestHeaders: error.config?.headers,
      responseData: error.response?.data
    });
    
    // Network/CORS errors
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message?.includes('Network') || !error.response) {
      console.error(`❌ Cannot connect to backend at ${apiUrl}`);
      console.error('🔍 Troubleshooting:');
      console.error('1. Check if backend is running:', `${apiUrl.replace('/api', '/health')}`);
      console.error('2. Verify NEXT_PUBLIC_API_URL:', apiUrl);
      console.error('3. Check CORS - Frontend origin:', currentOrigin);
      console.error('4. Backend should allow:', currentOrigin);
      
      // Show user-friendly error
      if (typeof window !== 'undefined') {
        const userError = new Error(`Cannot connect to server at ${apiUrl}. Please check:\n1. Backend is running\n2. CORS is configured\n3. Environment variables are set correctly`);
        (userError as any).isNetworkError = true;
        return Promise.reject(userError);
      }
    }
    
    // CORS errors
    if (error.message?.includes('CORS') || error.message?.includes('cors') || error.response?.status === 0) {
      console.error('🚫 CORS Error Detected');
      console.error('Frontend origin:', currentOrigin);
      console.error('Backend URL:', apiUrl);
      console.error('Solution: Add FRONTEND_URL to Render environment variables');
    }
    
    return Promise.reject(error);
  }
);

export default api;

