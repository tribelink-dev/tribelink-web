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

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const loadUser = async () => {
        try {
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Fetch fresh user data including tokens
            try {
              const response = await api.get('/user/me');
              if (response.data.user) {
                const updatedUser = {
                  id: response.data.user._id || response.data.user.id,
                  email: response.data.user.email,
                  phoneNumber: response.data.user.phoneNumber,
                  name: response.data.user.name,
                  tokens: response.data.user.tokens
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } catch (err) {
              // If fetch fails, use stored user data
              console.error('Error fetching user data:', err);
            }
          }
        } catch (error) {
          console.error('Error loading auth state:', error);
        } finally {
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
      
      setToken(newToken);
      
      // Fetch full user data including tokens
      try {
        const userResponse = await api.get('/user/me');
        if (userResponse.data.user) {
          const fullUser = {
            id: userResponse.data.user._id || userResponse.data.user.id,
            email: userResponse.data.user.email,
            phoneNumber: userResponse.data.user.phoneNumber,
            name: userResponse.data.user.name,
            tokens: userResponse.data.user.tokens
          };
          setUser(fullUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(fullUser));
          }
        } else {
          setUser(newUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
          }
        }
      } catch (err) {
        // Fallback to response user if fetch fails
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      }
      
      router.push('/');
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
      
      setToken(newToken);
      
      // Fetch full user data including tokens
      try {
        const userResponse = await api.get('/user/me');
        if (userResponse.data.user) {
          const fullUser = {
            id: userResponse.data.user._id || userResponse.data.user.id,
            email: userResponse.data.user.email,
            phoneNumber: userResponse.data.user.phoneNumber,
            name: userResponse.data.user.name,
            tokens: userResponse.data.user.tokens
          };
          setUser(fullUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(fullUser));
          }
        } else {
          setUser(newUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
          }
        }
      } catch (err) {
        // Fallback to response user if fetch fails
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      }
      
      router.push('/');
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

