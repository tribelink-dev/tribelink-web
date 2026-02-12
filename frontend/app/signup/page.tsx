'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import PhoneInput from '@/components/PhoneInput';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';
import { Sparkles, Lock, Mail, Phone, User, CheckCircle } from 'lucide-react';

type SignupStep = 'phone' | 'phone-otp' | 'email' | 'email-otp' | 'password';

export default function SignupPage(): JSX.Element {
  const [step, setStep] = useState<SignupStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [email, setEmail] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setOtpLoading(true);
    try {
      // PhoneInput component already formats with country code
      const response = await api.post('/auth/otp/generate/phone', {
        phoneNumber: phoneNumber
      });
      
      if (response.data.otp) {
        setDevOTP(response.data.otp);
      }
      
      setStep('phone-otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePhoneOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phoneOTP || phoneOTP.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // PhoneInput component already formats with country code
      await api.post('/auth/otp/verify', {
        phoneNumber: phoneNumber,
        otp: phoneOTP,
        type: 'phone'
      });
      
      setStep('email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setOtpLoading(true);
    setError('');
    try {
      // PhoneInput component already formats with country code
      const response = await api.post('/auth/otp/generate/email', {
        email: email.trim(),
        phoneNumber: phoneNumber
      }, {
        timeout: 30000
      });
      
      if (response.data.otp) {
        setDevOTP(response.data.otp);
      }
      
      if (response.data.message && response.data.message.includes('failed')) {
        setError(response.data.message);
        if (response.data.otp) {
          setStep('email-otp');
        }
      } else {
        setStep('email-otp');
      }
    } catch (err: any) {
      console.error('Email OTP error:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleEmailOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!emailOTP || emailOTP.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // PhoneInput component already formats with country code
      await api.post('/auth/otp/verify', {
        phoneNumber: phoneNumber,
        email: email.trim(),
        otp: emailOTP,
        type: 'email'
      });
      
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !password || !confirmPassword) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // PhoneInput component already formats with country code
      await signup(email.trim(), phoneNumber, password, name);
      
      // Check for returnTo parameter (or redirect for backward compatibility), default to /explore
      const returnTo = searchParams.get('returnTo') || searchParams.get('redirect') || '/explore';
      router.push(returnTo);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = (): number => {
    switch (step) {
      case 'phone': return 1;
      case 'phone-otp': return 2;
      case 'email': return 3;
      case 'email-otp': return 4;
      case 'password': return 5;
      default: return 1;
    }
  };

  const getStepTitle = (): string => {
    switch (step) {
      case 'phone': return 'Enter Your Phone Number';
      case 'phone-otp': return 'Verify Phone Number';
      case 'email': return 'Enter Your Email';
      case 'email-otp': return 'Verify Email Address';
      case 'password': return 'Create Your Account';
      default: return 'Sign Up';
    }
  };

  const getStepDescription = (): string => {
    switch (step) {
      case 'phone': return "We'll verify your phone number";
      case 'phone-otp': return 'Check your messages for the code';
      case 'email': return "We'll verify your email address";
      case 'email-otp': return 'Check your inbox for the code';
      case 'password': return 'Set up your account password';
      default: return '';
    }
  };

  const renderStep = (): JSX.Element => {
    switch (step) {
      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Enter phone number"
                required
                disabled={otpLoading}
              />
            </div>

            <motion.button
              type="submit"
              disabled={otpLoading}
              whileHover={{ scale: otpLoading ? 1 : 1.02 }}
              whileTap={{ scale: otpLoading ? 1 : 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold text-base rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {otpLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>
        );

      case 'phone-otp':
        return (
          <form onSubmit={handlePhoneOTPVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter OTP sent to {phoneNumber}
              </label>
              <input
                type="text"
                value={phoneOTP}
                onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-bold text-2xl tracking-widest text-center"
                maxLength={6}
                disabled={loading}
              />
              {devOTP && (
                <div className="mt-3 p-3 bg-heritage-gold/10 border border-heritage-gold/30 rounded-lg">
                  <p className="text-xs text-gray-800 text-center">
                    <span className="font-semibold">Development OTP:</span> <span className="font-mono font-bold">{devOTP}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setPhoneOTP('');
                  setError('');
                }}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>
          </form>
        );

      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                  disabled={otpLoading}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone-otp');
                  setEmail('');
                  setError('');
                }}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                disabled={otpLoading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={otpLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </form>
        );

      case 'email-otp':
        return (
          <form onSubmit={handleEmailOTPVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter OTP sent to {email}
              </label>
              <input
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-bold text-2xl tracking-widest text-center"
                maxLength={6}
                disabled={loading}
              />
              {devOTP && (
                <div className="mt-3 p-3 bg-heritage-gold/10 border border-heritage-gold/30 rounded-lg">
                  <p className="text-xs text-gray-800 text-center">
                    <span className="font-semibold">Development OTP:</span> <span className="font-mono font-bold">{devOTP}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setEmailOTP('');
                  setError('');
                }}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('email-otp');
                  setPassword('');
                  setConfirmPassword('');
                  setName('');
                  setError('');
                }}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        );
      default:
        return <div></div>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background Elements - Matching Explore Page */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-10 w-96 h-96 bg-heritage-gold/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-cream-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50"
        >
          {/* Header Section with Heritage Gold Gradient */}
          <div className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50/80 to-heritage-gold-light/5 px-8 py-10 text-center overflow-hidden border-b border-heritage-gold/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
              >
                {getStepTitle()}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600"
              >
                {getStepDescription()}
              </motion.p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-8 pt-6 pb-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((stepNum) => {
                const currentStepNum = getStepNumber();
                const isCompleted = stepNum < currentStepNum;
                const isCurrent = stepNum === currentStepNum;
                
                return (
                  <div key={stepNum} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: stepNum * 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-heritage-gold text-white ring-4 ring-heritage-gold/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          stepNum
                        )}
                      </motion.div>
                      {stepNum < 5 && (
                        <div className={`h-1 w-full mt-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8 bg-white">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm font-medium flex-1">{error}</p>
                </div>
              </motion.div>
            )}

            {renderStep()}

            {/* Footer Links */}
            <div className="mt-8 space-y-3 text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-heritage-gold hover:text-heritage-gold-dark transition-colors">
                  Sign in here
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                Want to become a host?{' '}
                <Link href="/host/signup" className="font-semibold text-heritage-gold hover:text-heritage-gold-dark transition-colors">
                  Sign up as host
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
