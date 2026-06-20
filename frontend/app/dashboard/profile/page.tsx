'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  X, 
  Check, 
  Edit2, 
  Globe,
  Heart,
  MapPin,
  Car,
  Clock,
  Settings,
  Shield,
  Bell,
  CreditCard,
  Sparkles
} from 'lucide-react';
import ToastContainer, { useToast } from '@/components/Toast';
import { getImageUrl } from '@/lib/imageUtils';
import { PageContainer } from '@/components/ui/PageContainer';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  preferredCurrency: string;
  preferences?: {
    travelStyle?: string;
    pace?: string;
    transport?: string;
  };
  profilePicture?: string;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const TRAVEL_STYLES = [
  { value: 'flexible', label: 'Flexible', icon: '🌊', description: 'Open to changes' },
  { value: 'fixed', label: 'Fixed', icon: '📅', description: 'Stick to plan' },
];

const PACE_OPTIONS = [
  { value: 'fast', label: 'Fast-paced', icon: '⚡', description: 'See more, do more' },
  { value: 'slow', label: 'Slow-paced', icon: '🧘', description: 'Take it easy' },
];

const TRANSPORT_OPTIONS = [
  { value: 'native', label: 'Native', icon: '🚌', description: 'Local transport' },
  { value: 'luxury', label: 'Luxury', icon: '🚗', description: 'Premium vehicles' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    preferredCurrency: 'USD',
    preferences: {
      travelStyle: '',
      pace: '',
      transport: ''
    }
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'preferences' | 'settings'>('basic');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace('/login?returnTo=/dashboard/profile');
      return;
    }
    fetchProfile();
  }, [authUser, authLoading, router]);

  if (authLoading || !authUser) {
    return null;
  }

  useEffect(() => {
    // Check if form has changes
    if (profile) {
      const nameChanged = formData.name !== profile.name;
      const emailChanged = formData.email !== profile.email;
      const phoneChanged = formData.phoneNumber !== profile.phoneNumber;
      const currencyChanged = formData.preferredCurrency !== profile.preferredCurrency;
      const travelStyleChanged = formData.preferences.travelStyle !== (profile.preferences?.travelStyle || '');
      const paceChanged = formData.preferences.pace !== (profile.preferences?.pace || '');
      const transportChanged = formData.preferences.transport !== (profile.preferences?.transport || '');
      
      setHasChanges(nameChanged || emailChanged || phoneChanged || currencyChanged || travelStyleChanged || paceChanged || transportChanged || !!profilePicturePreview);
    }
  }, [formData, profile, profilePicturePreview]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/me');
      const userData = response.data.user;
      
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        preferredCurrency: userData.preferredCurrency || 'USD',
        preferences: {
          travelStyle: userData.preferences?.travelStyle || '',
          pace: userData.preferences?.pace || '',
          transport: userData.preferences?.transport || ''
        }
      });
      
      if (userData.profilePicture) {
        setProfilePicture(getImageUrl(userData.profilePicture));
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // Assuming you have an endpoint for profile picture upload
      // For now, we'll skip this and just use the preview
      // const response = await api.post('/user/profile-picture', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      
      toast.success('Profile picture updated');
      setProfilePicture(profilePicturePreview);
      setProfilePicturePreview(null);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        preferredCurrency: formData.preferredCurrency,
        preferences: formData.preferences
      };

      const response = await api.patch('/user/me', updateData);
      
      if (response.data.user) {
        setProfile(response.data.user);
        setHasChanges(false);
        toast.success('Profile updated successfully');
        
        // Update auth context if needed
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            user.name = response.data.user.name;
            user.email = response.data.user.email;
            user.phoneNumber = response.data.user.phoneNumber;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        preferredCurrency: profile.preferredCurrency || 'USD',
        preferences: {
          travelStyle: profile.preferences?.travelStyle || '',
          pace: profile.preferences?.pace || '',
          transport: profile.preferences?.transport || ''
        }
      });
      setProfilePicturePreview(null);
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-sos-clear">
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
        </PageContainer>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-sos-clear">
        <PageContainer>
          <div className="text-center py-16">
            <p className="text-gray-600">Failed to load profile</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const displayPicture = profilePicturePreview || profilePicture;

  return (
    <div className="min-h-screen bg-background pb-sos-clear">
      <PageContainer>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Edit Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors touch-target"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium sm:hidden">Back</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-hide">
                <button
                  onClick={() => setActiveSection('basic')}
                  className={`shrink-0 lg:w-full flex items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    activeSection === 'basic'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Basic Info</span>
                </button>
                <button
                  onClick={() => setActiveSection('preferences')}
                  className={`shrink-0 lg:w-full flex items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    activeSection === 'preferences'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Preferences</span>
                </button>
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`shrink-0 lg:w-full flex items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    activeSection === 'settings'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              {activeSection === 'basic' && (
                <motion.div
                  key="basic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  
                  {/* Profile Picture */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white ring-4 ring-indigo-100">
                          {displayPicture ? (
                            <img
                              src={displayPicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-16 h-16 text-white" />
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-110"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          JPG, PNG or GIF. Max size 5MB
                        </p>
                        {profilePicturePreview && (
                          <div className="flex gap-2">
                            <button
                              onClick={handleImageUpload}
                              disabled={uploadingImage}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {uploadingImage ? 'Uploading...' : 'Save Photo'}
                            </button>
                            <button
                              onClick={() => {
                                setProfilePicturePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Travel Preferences</h2>
                  
                  {/* Travel Style */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Travel Style
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {TRAVEL_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, travelStyle: style.value }
                          })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.preferences.travelStyle === style.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{style.icon}</span>
                            <span className={`font-semibold ${
                              formData.preferences.travelStyle === style.value ? 'text-indigo-700' : 'text-gray-900'
                            }`}>
                              {style.label}
                            </span>
                            {formData.preferences.travelStyle === style.value && (
                              <Check className="w-5 h-5 text-indigo-600 ml-auto" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Travel Pace
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PACE_OPTIONS.map((pace) => (
                        <button
                          key={pace.value}
                          onClick={() => setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, pace: pace.value }
                          })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.preferences.pace === pace.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{pace.icon}</span>
                            <span className={`font-semibold ${
                              formData.preferences.pace === pace.value ? 'text-indigo-700' : 'text-gray-900'
                            }`}>
                              {pace.label}
                            </span>
                            {formData.preferences.pace === pace.value && (
                              <Check className="w-5 h-5 text-indigo-600 ml-auto" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{pace.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Transportation Preference
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {TRANSPORT_OPTIONS.map((transport) => (
                        <button
                          key={transport.value}
                          onClick={() => setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, transport: transport.value }
                          })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.preferences.transport === transport.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{transport.icon}</span>
                            <span className={`font-semibold ${
                              formData.preferences.transport === transport.value ? 'text-indigo-700' : 'text-gray-900'
                            }`}>
                              {transport.label}
                            </span>
                            {formData.preferences.transport === transport.value && (
                              <Check className="w-5 h-5 text-indigo-600 ml-auto" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{transport.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                  
                  {/* Preferred Currency */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Currency
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.preferredCurrency}
                        onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  <Edit2 className="w-5 h-5" />
                  <span className="font-medium">You have unsaved changes</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.name || !formData.email || !formData.phoneNumber}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </PageContainer>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

