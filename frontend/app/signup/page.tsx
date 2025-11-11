'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

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
  const { signup } = useAuth();
  const router = useRouter();

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?[1-9]\d{9,14}$/.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +1234567890)');
      return;
    }

    setOtpLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await api.post('/auth/otp/generate/phone', {
        phoneNumber: formattedPhone
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
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await api.post('/auth/otp/verify', {
        phoneNumber: formattedPhone,
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
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await api.post('/auth/otp/generate/email', {
        email: email.trim(),
        phoneNumber: formattedPhone
      });
      
      if (response.data.otp) {
        setDevOTP(response.data.otp);
      }
      
      setStep('email-otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
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
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await api.post('/auth/otp/verify', {
        phoneNumber: formattedPhone,
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
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await signup(email.trim(), formattedPhone, password, name);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (): JSX.Element => {
    switch (step) {
      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="+1234567890"
                className="input-field"
                disabled={otpLoading}
              />
              <p className="text-xs text-gray-500 mt-1.5">Use international format (e.g., +1234567890)</p>
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-4 h-4"></span>
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        );

      case 'phone-otp':
        return (
          <form onSubmit={handlePhoneOTPVerify} className="space-y-6">
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
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                disabled={loading}
              />
              {devOTP && (
                <p className="text-xs text-primary-600 mt-2 text-center">
                  Development OTP: <strong>{devOTP}</strong>
                </p>
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
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4"></span>
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
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field"
                disabled={otpLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone-otp');
                  setEmail('');
                  setError('');
                }}
                className="btn-secondary flex-1"
                disabled={otpLoading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={otpLoading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4"></span>
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
          <form onSubmit={handleEmailOTPVerify} className="space-y-6">
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
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                disabled={loading}
              />
              {devOTP && (
                <p className="text-xs text-primary-600 mt-2 text-center">
                  Development OTP: <strong>{devOTP}</strong>
                </p>
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
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4"></span>
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm your password"
                className="input-field"
                disabled={loading}
              />
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
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4"></span>
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

  const getStepTitle = (): string => {
    switch (step) {
      case 'phone':
        return 'Enter Your Phone Number';
      case 'phone-otp':
        return 'Verify Phone Number';
      case 'email':
        return 'Enter Your Email';
      case 'email-otp':
        return 'Verify Email Address';
      case 'password':
        return 'Create Your Account';
      default:
        return 'Sign Up';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-tourism p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="content-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-medium p-2">
              <Image 
                src="/tribelink-logo.svg" 
                alt="Tribelink Logo" 
                width={64} 
                height={64}
                className="w-full h-full"
              />
            </div>
            <h1 className="heading-primary text-gray-900">
              {getStepTitle()}
            </h1>
            <p className="text-subtitle text-gray-600 mb-0">
              {(() => {
                switch (step) {
                  case 'phone': return "We'll verify your phone number";
                  case 'phone-otp': return 'Check your messages for the code';
                  case 'email': return "We'll verify your email address";
                  case 'email-otp': return 'Check your inbox for the code';
                  case 'password': return 'Set up your account password';
                  default: return '';
                }
              })()}
            </p>
          </div>
          
          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {renderStep()}

          <div className="divider"></div>
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in here
              </Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              Want to become a host?{' '}
              <Link href="/host/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign up as host
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
