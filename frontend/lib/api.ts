import axios, { type AxiosError } from 'axios';

function normalizeApiBaseUrl(raw: string | undefined): string {
  const fallback = 'http://localhost:5000/api';
  if (raw == null || !String(raw).trim()) return fallback;
  const trimmed = String(raw).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '') || fallback;
  }
  const hostPart = trimmed.replace(/^\/+/, '');
  const isLocal =
    /^localhost\b/i.test(hostPart) ||
    /^127\.0\.0\.1\b/.test(hostPart) ||
    /^192\.168\./.test(hostPart) ||
    /^10\./.test(hostPart) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostPart);
  const scheme = isLocal ? 'http://' : 'https://';
  return `${scheme}${hostPart}`.replace(/\/+$/, '') || fallback;
}

const rawApiEnv = process.env.NEXT_PUBLIC_API_URL;
const API_URL = normalizeApiBaseUrl(rawApiEnv);

/** On production triberoutes.com hosts, call API via same-origin /tr-api Route Handler proxy. */
function sameOriginApiBasePath(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'triberoutes.com' || host === 'www.triberoutes.com') {
    return '/tr-api';
  }
  if (host.endsWith('.triberoutes.com')) {
    return '/tr-api';
  }
  return null;
}

if (typeof window !== 'undefined' && rawApiEnv && !/^https?:\/\//i.test(String(rawApiEnv).trim())) {
  console.warn('[api] NEXT_PUBLIC_API_URL should start with https:// or http://. Using:', API_URL);
}

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
  timeout: 30000, // 30 seconds timeout for all requests
});

// Add token to requests. On triberoutes.com always use same-origin /tr-api (Route Handler → API)
// so the browser never calls api.* directly (avoids CORS and mixed-origin issues). Multipart included.
api.interceptors.request.use((config) => {
  const proxied = sameOriginApiBasePath();
  config.baseURL = proxied ?? API_URL;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // If FormData is being sent, remove Content-Type header to let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
          console.log('Redirecting to login due to invalid token...');
          // Use setTimeout to avoid navigation during render
          setTimeout(() => {
            window.location.href = '/host/login';
          }, 100);
        }
      }
      
      const authError: AppError = new Error(errorMessage);
      authError.isAuthError = true;
      authError.status = 401;
      return Promise.reject(authError);
    }
    
    // Timeouts (often large uploads) — avoid mislabeling as "cannot connect"
    if (error.code === 'ECONNABORTED' && typeof window !== 'undefined') {
      const timeoutError: AppError = new Error(
        'Request timed out while talking to the server. Try smaller or fewer images, a stronger network, or wait and submit again.'
      );
      timeoutError.isNetworkError = true;
      return Promise.reject(timeoutError);
    }

    // Network / failed CORS preflight (browser hides response → no error.response)
    if (
      error.code === 'ECONNREFUSED' ||
      error.message === 'Network Error' ||
      error.message?.includes('Network') ||
      !error.response
    ) {
      const reqBase = (error?.config?.baseURL as string | undefined) ?? apiUrl;
      const reqPath = (error?.config?.url as string | undefined) ?? '';
      const attempted =
        reqBase.startsWith('/') && typeof window !== 'undefined'
          ? `${window.location.origin}${reqBase}${reqPath}`
          : `${reqBase}${reqPath}`;

      console.error(`❌ Request failed (no response): ${attempted}`);
      console.error('🔍 Upstream health:', `${apiUrl.replace(/\/api\/?$/, '')}/health`);
      console.error('🔍 NEXT_PUBLIC_API_URL:', apiUrl, '| origin:', currentOrigin);

      if (typeof window !== 'undefined') {
        const viaProxy = reqBase === '/tr-api';
        const userError: AppError = new Error(
          viaProxy
            ? `Cannot reach the API through this site (proxy). Confirm the latest frontend is deployed and API_UPSTREAM_ORIGIN on Vercel points to your API. Open ${apiUrl.replace(/\/api\/?$/, '')}/health in a new tab — if that loads, try again or contact support.`
            : `Cannot reach the API at ${attempted}. Check your network, try incognito without extensions, or confirm NEXT_PUBLIC_API_URL. API health: ${apiUrl.replace(/\/api\/?$/, '')}/health`
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

