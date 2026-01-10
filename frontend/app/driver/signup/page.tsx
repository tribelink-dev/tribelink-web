'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';

type SignupStep = 'account' | 'license' | 'vehicle' | 'documents' | 'complete';

interface FormData {
  // Account info
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  
  // License info
  licenseNumber: string;
  licenseFile: File | null;
  
  // Vehicle info
  vehicleType: 'Sedan' | 'SUV' | 'Luxury' | 'Van' | 'Mini Bus' | 'Bus';
  make: string;
  model: string;
  year: string;
  capacity: string;
  registrationNumber: string;
  
  // Documents
  registrationFile: File | null;
  insuranceFile: File | null;
  profilePicture: File | null;
  
  // Additional
  languages: string[];
  pricingPerDay: string;
}

const COMMON_LANGUAGES = [
  'English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia'
];

export default function DriverSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    licenseNumber: '',
    licenseFile: null,
    vehicleType: 'Sedan',
    make: '',
    model: '',
    year: '',
    capacity: '',
    registrationNumber: '',
    registrationFile: null,
    insuranceFile: null,
    profilePicture: null,
    languages: [],
    pricingPerDay: '50'
  });

  const [filePreviews, setFilePreviews] = useState<{
    license?: string;
    registration?: string;
    insurance?: string;
    profile?: string;
  }>({});

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

  const handleFileChange = (field: 'licenseFile' | 'registrationFile' | 'insuranceFile' | 'profilePicture', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: file }));
      setError('');
      
      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({ ...prev, [field.replace('File', '').replace('Picture', '')]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  // Check if user is already logged in (coming from /host/signup)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (hostData && token) {
        try {
          const parsedHost = JSON.parse(hostData);
          
          // Only proceed if it's a DRIVER_PARTNER
          if (parsedHost.providerType === 'DRIVER_PARTNER') {
            // Normalize providerId
            let normalizedId: string;
            if (parsedHost._id) {
              normalizedId = typeof parsedHost._id === 'string' ? parsedHost._id : parsedHost._id.toString();
            } else if (parsedHost.id) {
              normalizedId = typeof parsedHost.id === 'string' ? parsedHost.id : parsedHost.id.toString();
            } else {
              console.error('No provider ID found in host object:', parsedHost);
              return;
            }
            
            // Validate ObjectId format
            if (/^[0-9a-fA-F]{24}$/.test(normalizedId)) {
              setProviderId(normalizedId);
              setIsExistingUser(true);
              // Pre-populate form with existing data
              setFormData(prev => ({
                ...prev,
                name: parsedHost.name || '',
                email: parsedHost.email || '',
                phoneNumber: parsedHost.phoneNumber || ''
              }));
              // Skip account step and go directly to license
              setCurrentStep('license');
            }
          }
        } catch (err) {
          console.error('Error parsing host data:', err);
        }
      }
    }
  }, []);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password) {
      setError('Please fill all fields');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +1234567890)');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      const response = await api.post('/auth/host/signup', {
        email: formData.email,
        phoneNumber: formattedPhone,
        password: formData.password,
        name: formData.name,
        providerType: 'DRIVER_PARTNER'
      });

      const { token, host } = response.data;
      
      // Store authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('host', JSON.stringify(host));
        localStorage.setItem('userType', 'host');
      }

      // Normalize providerId - handle different formats
      let normalizedId: string;
      if (host._id) {
        normalizedId = typeof host._id === 'string' ? host._id : host._id.toString();
      } else if (host.id) {
        normalizedId = typeof host.id === 'string' ? host.id : host.id.toString();
      } else {
        console.error('No provider ID found in host object:', host);
        setError('Failed to get provider ID. Please try again.');
        return;
      }
      
      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(normalizedId)) {
        console.error('Invalid provider ID format:', normalizedId);
        setError('Invalid provider ID format. Please try again.');
        return;
      }
      
      setProviderId(normalizedId);
      setCurrentStep('license');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.licenseNumber || !formData.licenseFile) {
      setError('Please provide license number and upload license document');
      return;
    }

    if (!providerId) {
      setError('Session expired. Please start over.');
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('document', formData.licenseFile);
      formDataToSend.append('documentType', 'License');
      formDataToSend.append('documentName', formData.licenseFile.name);
      formDataToSend.append('licenseNumber', formData.licenseNumber);

      await api.post(`/drivers/documents/${providerId}`, formDataToSend);
      setCurrentStep('vehicle');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload license');
    } finally {
      setUploading(false);
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.make || !formData.model || !formData.year || !formData.capacity || !formData.registrationNumber) {
      setError('Please fill all vehicle fields');
      return;
    }

    if (!providerId) {
      setError('Session expired. Please start over.');
      return;
    }

    setUploading(true);
    try {
      // Update vehicle details
      await api.put(`/drivers/profile/${providerId}`, {
        vehicleDetails: {
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          capacity: parseInt(formData.capacity),
          registrationNumber: formData.registrationNumber
        },
        vehicleType: formData.vehicleType,
        pricing: {
          perDay: parseFloat(formData.pricingPerDay) || 50,
          currency: 'USD'
        }
      });

      // Upload registration document if provided
      if (formData.registrationFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('document', formData.registrationFile);
        formDataToSend.append('documentType', 'Registration');
        formDataToSend.append('documentName', formData.registrationFile.name);
        formDataToSend.append('registrationNumber', formData.registrationNumber);
        await api.post(`/drivers/documents/${providerId}`, formDataToSend);
      }

      setCurrentStep('documents');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vehicle information');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.insuranceFile) {
      setError('Please upload insurance document');
      return;
    }

    if (!providerId) {
      setError('Session expired. Please start over.');
      return;
    }

    setUploading(true);
    try {
      // Upload insurance
      const insuranceFormData = new FormData();
      insuranceFormData.append('document', formData.insuranceFile);
      insuranceFormData.append('documentType', 'Insurance');
      insuranceFormData.append('documentName', formData.insuranceFile.name);
      await api.post(`/drivers/documents/${providerId}`, insuranceFormData);

      // Upload profile picture if provided
      if (formData.profilePicture) {
        const profileFormData = new FormData();
        profileFormData.append('profilePicture', formData.profilePicture);
        await api.post(`/drivers/profile-picture/${providerId}`, profileFormData);
      }

      // Update languages if selected
      if (formData.languages.length > 0) {
        await api.put(`/drivers/profile/${providerId}`, {
          languages: formData.languages
        });
      }

      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    // Refresh driver profile to ensure all data is synced
    if (providerId) {
      try {
        await api.get(`/drivers/profile/${providerId}`);
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    }
    // Redirect to professional dashboard
    router.push('/driver/dashboard');
  };

  const steps = isExistingUser 
    ? [
        { id: 'license', title: 'License', number: 1 },
        { id: 'vehicle', title: 'Vehicle', number: 2 },
        { id: 'documents', title: 'Documents', number: 3 }
      ]
    : [
        { id: 'account', title: 'Account', number: 1 },
        { id: 'license', title: 'License', number: 2 },
        { id: 'vehicle', title: 'Vehicle', number: 3 },
        { id: 'documents', title: 'Documents', number: 4 }
      ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">Driver Registration</h1>
            <span className="text-sm text-gray-600">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((getCurrentStepIndex() + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  index <= getCurrentStepIndex()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < getCurrentStepIndex() ? '✓' : step.number}
                </div>
                <span className={`text-xs mt-1 ${index <= getCurrentStepIndex() ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Step 1: Account Information */}
        {currentStep === 'account' && !isExistingUser && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600 mb-6">Let's start with your basic information</p>
            
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">International format (e.g., +1234567890)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: License Information */}
        {currentStep === 'license' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Driving License</h2>
            <p className="text-gray-600 mb-6">Upload your valid driving license</p>
            
            <form onSubmit={handleLicenseSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                  placeholder="DL1234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Document <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {filePreviews.license ? (
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={filePreviews.license}
                          alt="License Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, licenseFile: null });
                            setFilePreviews({ ...filePreviews, license: undefined });
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange('licenseFile', e)}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {!isExistingUser && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('account')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading || !formData.licenseNumber || !formData.licenseFile}
                  className={`${isExistingUser ? 'w-full' : 'flex-1'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50`}
                >
                  {uploading ? 'Uploading...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Vehicle Information */}
        {currentStep === 'vehicle' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
            <p className="text-gray-600 mb-6">Tell us about your vehicle</p>
            
            <form onSubmit={handleVehicleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as FormData['vehicleType'] })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Van">Van</option>
                    <option value="Mini Bus">Mini Bus</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                    placeholder="Toyota"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    placeholder="Camry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="2020"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Passenger Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                    placeholder="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    required
                    placeholder="ABC1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rate per Day (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pricingPerDay}
                    onChange={(e) => setFormData({ ...formData, pricingPerDay: e.target.value })}
                    required
                    min="1"
                    placeholder="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Document (RC)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors">
                    <div className="space-y-1 text-center">
                      {filePreviews.registration ? (
                        <div className="relative w-full max-w-md mx-auto">
                          <img
                            src={filePreviews.registration}
                            alt="Registration Preview"
                            className="max-h-64 mx-auto rounded-lg object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, registrationFile: null });
                              setFilePreviews({ ...filePreviews, registration: undefined });
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange('registrationFile', e)}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('license')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.make || !formData.model || !formData.year || !formData.capacity || !formData.registrationNumber}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Documents */}
        {currentStep === 'documents' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Documents</h2>
            <p className="text-gray-600 mb-6">Upload insurance and optional profile picture</p>
            
            <form onSubmit={handleDocumentsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Insurance <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {filePreviews.insurance ? (
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={filePreviews.insurance}
                          alt="Insurance Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, insuranceFile: null });
                            setFilePreviews({ ...filePreviews, insurance: undefined });
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange('insuranceFile', e)}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {filePreviews.profile ? (
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={filePreviews.profile}
                          alt="Profile Preview"
                          className="max-h-64 mx-auto rounded-full object-cover w-32 h-32"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, profilePicture: null });
                            setFilePreviews({ ...filePreviews, profile: undefined });
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => handleFileChange('profilePicture', e)}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Languages (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.languages.includes(lang)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                {formData.languages.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {formData.languages.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('vehicle')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.insuranceFile}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === 'complete' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Aboard!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your driver profile has been created successfully. You're all set to start accepting trips!
            </p>
            <button
              onClick={handleComplete}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


