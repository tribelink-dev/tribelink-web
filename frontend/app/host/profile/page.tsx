'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Settings,
  Bell,
  FileText,
  Shield
} from 'lucide-react';
import ToastContainer, { useToast } from '@/components/Toast';
import { getImageUrl } from '@/lib/imageUtils';
import HostSidebar from '@/components/HostSidebar';

interface HostProfile {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  bio?: string;
  providerType: string;
  notificationPreferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    bookingAlerts?: boolean;
    marketingEmails?: boolean;
  };
}

export default function HostProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      bookingAlerts: true,
      marketingEmails: false
    }
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'about' | 'settings'>('basic');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }
    }
    fetchProfile();
  }, [router]);

  useEffect(() => {
    // Check if form has changes
    if (profile) {
      const nameChanged = formData.name !== profile.name;
      const emailChanged = formData.email !== profile.email;
      const phoneChanged = formData.phoneNumber !== profile.phoneNumber;
      const bioChanged = formData.bio !== (profile.bio || '');
      const prefsChanged = JSON.stringify(formData.notificationPreferences) !== 
        JSON.stringify(profile.notificationPreferences || {});
      
      setHasChanges(nameChanged || emailChanged || phoneChanged || bioChanged || prefsChanged || !!profilePicturePreview);
    }
  }, [formData, profile, profilePicturePreview]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hosts/me');
      
      if (response.data.host) {
        const hostData = response.data.host;
        setProfile(hostData);
        setFormData({
          name: hostData.name || '',
          email: hostData.email || '',
          phoneNumber: hostData.phoneNumber || '',
          bio: hostData.bio || '',
          notificationPreferences: {
            emailNotifications: hostData.notificationPreferences?.emailNotifications ?? true,
            smsNotifications: hostData.notificationPreferences?.smsNotifications ?? false,
            bookingAlerts: hostData.notificationPreferences?.bookingAlerts ?? true,
            marketingEmails: hostData.notificationPreferences?.marketingEmails ?? false
          }
        });
        setProfilePicture(hostData.profilePicture || null);
      }
    } catch (err: any) {
      console.error('Error fetching host profile:', err);
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

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
      const formDataObj = new FormData();
      formDataObj.append('profilePicture', file);

      const response = await api.patch('/hosts/me', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.host) {
        setProfile(response.data.host);
        setProfilePicture(response.data.host.profilePicture);
        setProfilePicturePreview(null);
        toast.success('Profile picture updated');
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          const hostData = localStorage.getItem('host');
          if (hostData) {
            const host = JSON.parse(hostData);
            host.profilePicture = response.data.host.profilePicture;
            localStorage.setItem('host', JSON.stringify(host));
          }
        }
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error(err.response?.data?.message || 'Failed to upload profile picture');
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
        bio: formData.bio,
        notificationPreferences: formData.notificationPreferences
      };

      const response = await api.patch('/hosts/me', updateData);
      
      if (response.data.host) {
        setProfile(response.data.host);
        setHasChanges(false);
        toast.success('Profile updated successfully');
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          const hostData = localStorage.getItem('host');
          if (hostData) {
            const host = JSON.parse(hostData);
            host.name = response.data.host.name;
            host.email = response.data.host.email;
            host.phoneNumber = response.data.host.phoneNumber;
            host.bio = response.data.host.bio;
            host.profilePicture = response.data.host.profilePicture;
            localStorage.setItem('host', JSON.stringify(host));
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
        bio: profile.bio || '',
        notificationPreferences: {
          emailNotifications: profile.notificationPreferences?.emailNotifications ?? true,
          smsNotifications: profile.notificationPreferences?.smsNotifications ?? false,
          bookingAlerts: profile.notificationPreferences?.bookingAlerts ?? true,
          marketingEmails: profile.notificationPreferences?.marketingEmails ?? false
        }
      });
      setProfilePicturePreview(null);
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  const displayPicture = profilePicturePreview || (profilePicture ? getImageUrl(profilePicture) : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Profile</h1>
                <p className="text-gray-600">Manage your host account settings and information</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveSection('basic')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'basic'
                        ? 'bg-gradient-to-r from-slate-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Basic Info</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('about')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'about'
                        ? 'bg-gradient-to-r from-slate-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">About Me</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'settings'
                        ? 'bg-gradient-to-r from-slate-600 to-indigo-600 text-white shadow-lg'
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
                    className="bg-white rounded-2xl shadow-lg p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                    
                    {/* Profile Picture */}
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-4">Profile Picture</label>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-400 to-indigo-500 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white ring-4 ring-slate-100">
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
                            className="absolute bottom-0 right-0 w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 transition-all transform hover:scale-110"
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
                                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
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
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="Enter your full name"
                          required
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
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
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
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">About Me</h2>
                    
                    {/* Bio */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bio / Description
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all min-h-[200px] resize-y"
                        placeholder="Tell travelers about yourself, your background, and what makes your experiences special..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.bio.length}/1000 characters
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                    
                    {/* Email Notifications */}
                    <div className="mb-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="font-semibold text-gray-900">Email Notifications</span>
                            <p className="text-sm text-gray-600">Receive updates via email</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            notificationPreferences: {
                              ...formData.notificationPreferences,
                              emailNotifications: !formData.notificationPreferences.emailNotifications
                            }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notificationPreferences.emailNotifications
                              ? 'bg-slate-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notificationPreferences.emailNotifications
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>

                    {/* SMS Notifications */}
                    <div className="mb-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="font-semibold text-gray-900">SMS Notifications</span>
                            <p className="text-sm text-gray-600">Receive updates via SMS</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            notificationPreferences: {
                              ...formData.notificationPreferences,
                              smsNotifications: !formData.notificationPreferences.smsNotifications
                            }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notificationPreferences.smsNotifications
                              ? 'bg-slate-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notificationPreferences.smsNotifications
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>

                    {/* Booking Alerts */}
                    <div className="mb-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="font-semibold text-gray-900">Booking Alerts</span>
                            <p className="text-sm text-gray-600">Get notified about new bookings</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            notificationPreferences: {
                              ...formData.notificationPreferences,
                              bookingAlerts: !formData.notificationPreferences.bookingAlerts
                            }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notificationPreferences.bookingAlerts
                              ? 'bg-slate-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notificationPreferences.bookingAlerts
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>

                    {/* Marketing Emails */}
                    <div className="mb-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-gray-500" />
                          <div>
                            <span className="font-semibold text-gray-900">Marketing Emails</span>
                            <p className="text-sm text-gray-600">Receive tips and promotional content</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            notificationPreferences: {
                              ...formData.notificationPreferences,
                              marketingEmails: !formData.notificationPreferences.marketingEmails
                            }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notificationPreferences.marketingEmails
                              ? 'bg-slate-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notificationPreferences.marketingEmails
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
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
                      className="px-6 py-2 bg-gradient-to-r from-slate-600 to-indigo-600 text-white rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

