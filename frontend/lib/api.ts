import axios, { type AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHostSidePath = (path: string) =>
  path.startsWith('/host') || path.startsWith('/provider');

const getLoginRedirectPath = (): string => {
  if (typeof window === 'undefined') {
    return '/login';
  }

  const currentPath = window.location.pathname;
  const userType = localStorage.getItem('userType');
  if (isHostSidePath(currentPath) || userType === 'host') {
    return '/host/login';
  }
  return '/login';
};

// Warn if using localhost in production
if (typeof window !== 'undefined' && API_URL.includes('localhost') && window.location.hostname !== 'localhost') {
  console.error('⚠️ WARNING: Using localhost API URL in production!');
  console.error('   Current API URL:', API_URL);
  console.error('   Set NEXT_PUBLIC_API_URL environment variable in Vercel to your production backend URL');
  console.error('   Example: https://your-backend.onrender.com/api');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 60s default — covers Render free-tier cold starts (typically 30–60s for the
  // first request to wake the dyno). FormData uploads override this to 15min
  // in the request interceptor below.
  timeout: 60000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If FormData is being sent, remove Content-Type header to let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    const t = config.timeout;
    if (t == null || t < 120000) {
      config.timeout = 900000;
    }
  }

  return config;
});

interface AppError extends Error {
  isAuthError?: boolean;
  isNetworkError?: boolean;
  status?: number;
}

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError | any) => {
    // Enhanced error logging
    const apiUrl = API_URL;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';

    // Safely log error details (only for non-public pages or non-401 errors)
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const publicPages = ['/', '/explore', '/abodes', '/trips/select', '/trips/abodes', '/trips/experiences', '/events'];
    const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page + '/'));

    // Only log detailed errors if:
    // 1. Not a 401 error (handled separately)
    // 2. Not a 404 on public pages (expected for missing endpoints)
    // 3. Not a network error (handled separately)
    const shouldLogDetails =
      error.response?.status !== 401 &&
      !(error.response?.status === 404 && isPublicPage) &&
      error.code !== 'ECONNREFUSED' &&
      error.message !== 'Network Error';

    if (shouldLogDetails) {
    try {
      console.error('API Error Details:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        apiUrl: apiUrl,
        currentOrigin: currentOrigin,
        requestUrl: error?.config?.url,
        fullUrl: error?.config ? `${apiUrl}${error.config.url}` : 'unknown',
        requestHeaders: error?.config?.headers,
        responseData: error?.response?.data
      });
    } catch (logError) {
      // Fallback if logging itself fails
      console.error('API Error (logging failed):', error);
      }
    }

    // Handle 401 Unauthorized (Invalid token, expired token, etc.)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Invalid token';
      console.error('🔐 Authentication Error:', errorMessage);

      // Clear invalid token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('host');
        localStorage.removeItem('user');

        // Only redirect if we're not on a public page and not already on a login page
        const currentPath = window.location.pathname;
        const publicPages = ['/', '/explore', '/abodes', '/trips/select', '/trips/abodes', '/trips/experiences', '/events'];
        const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page + '/'));

        if (!isPublicPage && !currentPath.includes('/login') && !currentPath.includes('/signup')) {
          const redirectPath = getLoginRedirectPath();
          console.log('Redirecting to login due to invalid token...');
          // Use setTimeout to avoid navigation during render
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 100);
        }
      }

      const authError: AppError = new Error(errorMessage);
      authError.isAuthError = true;
      authError.status = 401;
      return Promise.reject(authError);
    }

    // Upload / slow requests (client timeout)
    if (error.code === 'ECONNABORTED' && typeof window !== 'undefined') {
      const timeoutError: AppError = new Error(
        'Request timed out. Photo uploads are compressed before sending; try fewer or smaller images or a faster connection.'
      );
      timeoutError.isNetworkError = true;
      return Promise.reject(timeoutError);
    }

    // Network/CORS errors
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message?.includes('Network') || !error.response) {
      console.error(`❌ Cannot connect to backend at ${apiUrl}`);
      console.error('🔍 Troubleshooting:');
      console.error(
        '1. Check if backend is running:',
        `${apiUrl.replace(/\/api\/?$/, '')}/health`
      );
      console.error('2. Verify NEXT_PUBLIC_API_URL:', apiUrl);
      console.error('3. Check CORS - Frontend origin:', currentOrigin);
      console.error('4. Backend should allow:', currentOrigin);

      if (typeof window !== 'undefined') {
        const userError: AppError = new Error(
          'Network error talking to the server. The backend may be waking up after being idle (free hosting tier). Please wait a few seconds and try again.'
        );
        userError.isNetworkError = true;
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
