'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  name: string;
  tokens?: number;
  preferences?: {
    travelStyle?: string;
    pace?: string;
    transport?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string, isEmail: boolean) => Promise<void>;
  signup: (email: string, phoneNumber: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user data when token changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if user is a host/provider - if so, skip /user/me call
      if (typeof window !== 'undefined') {
        const userType = localStorage.getItem('userType');
        const hostData = localStorage.getItem('host');
        
        // If user is a host/provider, don't call /user/me endpoint
        if (userType === 'host' || hostData) {
          // Use stored user data if available, otherwise set loading to false
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (parseErr) {
              console.error('Error parsing stored user:', parseErr);
            }
          }
          setLoading(false);
          return;
        }
      }

      try {
        const response = await api.get('/user/me');
        if (response.data.user) {
          const updatedUser = {
            id: response.data.user._id || response.data.user.id,
            email: response.data.user.email,
            phoneNumber: response.data.user.phoneNumber,
            name: response.data.user.name,
            tokens: response.data.user.tokens,
            preferences: response.data.user.preferences
          };
          setUser(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      } catch (err: any) {
        // Only log error if it's not a 403 (which is expected for hosts)
        if (err.response?.status !== 403) {
        console.error('Error fetching user data:', err);
        }
        // If fetch fails and we have stored user, use it
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (parseErr) {
              console.error('Error parsing stored user:', parseErr);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const loadUser = async () => {
        try {
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          if (storedToken) {
            setToken(storedToken);
            // If we have stored user, set it temporarily while fetching fresh data
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
              } catch (err) {
                console.error('Error parsing stored user:', err);
              }
            }
            // The useEffect above will fetch fresh data
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error loading auth state:', error);
          setLoading(false);
        }
      };
      loadUser();
    }
  }, []);

  const login = async (emailOrPhone: string, password: string, isEmail: boolean) => {
    try {
      const payload: { password: string; email?: string; phoneNumber?: string } = { password };
      
      const trimmedValue = emailOrPhone.trim();
      if (trimmedValue.length === 0) {
        throw new Error(isEmail ? 'Email is required' : 'Phone number is required');
      }
      
      if (isEmail) {
        payload.email = trimmedValue;
      } else {
        payload.phoneNumber = trimmedValue;
      }

      console.log('Login request:', { isEmail, hasEmail: !!payload.email, hasPhone: !!payload.phoneNumber, payload });
      const response = await api.post('/auth/login', payload);
      console.log('Login response:', response.data);
      
      const { token: newToken, user: newUser } = response.data;
      
      if (!newToken || !newUser) {
        throw new Error('Invalid response from server');
      }
      
      // Store token first - this will trigger the useEffect to fetch fresh user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      setToken(newToken);
      setUser(newUser); // Set immediately for quick UI update
      
      // Small delay to ensure state updates before redirect
      // The useEffect will fetch fresh data with tokens in the background
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Redirect is handled by the calling page (login/signup) to support redirect parameters
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestUrl: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      // Handle network errors specifically
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message?.includes('Network')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        throw new Error(`Cannot connect to server at ${apiUrl}. Please make sure the backend server is running on port 5000.`);
      }
      
      // Handle CORS errors
      if (error.message?.includes('CORS') || error.message?.includes('cors')) {
        throw new Error('CORS error: The server is blocking requests from this origin. Please check backend CORS configuration.');
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, phoneNumber: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/signup', { email, phoneNumber, password, name });
      const { token: newToken, user: newUser } = response.data;
      
      // Store token first - this will trigger the useEffect to fetch fresh user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      setToken(newToken);
      setUser(newUser); // Set immediately for quick UI update
      
      // Small delay to ensure state updates before redirect
      // The useEffect will fetch fresh data with tokens in the background
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Redirect is handled by the calling page (login/signup) to support redirect parameters
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

