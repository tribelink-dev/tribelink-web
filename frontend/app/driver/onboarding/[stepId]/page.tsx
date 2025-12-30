'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  documentType?: 'License' | 'Insurance' | 'Registration' | 'Other';
  fieldName?: string;
  isProfilePicture?: boolean;
  formFields?: {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
  }[];
}

const STEP_CONFIGS: { [key: string]: StepConfig } = {
  'driving-license': {
    id: 'driving-license',
    title: 'Driving License',
    description: 'Upload your valid driving license document',
    documentType: 'License',
    fieldName: 'licenseDocument',
    formFields: [
      {
        name: 'licenseNumber',
        label: 'License Number',
        type: 'text',
        placeholder: 'Enter your license number',
        required: true
      }
    ]
  },
  'profile-picture': {
    id: 'profile-picture',
    title: 'Profile Picture',
    description: 'Upload your profile picture',
    isProfilePicture: true,
    fieldName: 'profilePicture'
  },
  'vehicle-registration': {
    id: 'vehicle-registration',
    title: 'Vehicle Registration (RC)',
    description: 'Upload your vehicle registration certificate',
    documentType: 'Registration',
    fieldName: 'registrationDocument',
    formFields: [
      {
        name: 'registrationNumber',
        label: 'Registration Number',
        type: 'text',
        placeholder: 'Enter vehicle registration number',
        required: true
      }
    ]
  },
  'vehicle-insurance': {
    id: 'vehicle-insurance',
    title: 'Vehicle Insurance',
    description: 'Upload your vehicle insurance document',
    documentType: 'Insurance',
    fieldName: 'insuranceDocument'
  },
  'vehicle-details': {
    id: 'vehicle-details',
    title: 'Vehicle Details',
    description: 'Enter your vehicle information',
    formFields: [
      {
        name: 'make',
        label: 'Vehicle Make',
        type: 'text',
        placeholder: 'e.g., Toyota, Honda',
        required: true
      },
      {
        name: 'model',
        label: 'Vehicle Model',
        type: 'text',
        placeholder: 'e.g., Camry, Accord',
        required: true
      },
      {
        name: 'year',
        label: 'Year',
        type: 'number',
        placeholder: 'e.g., 2020',
        required: true
      },
      {
        name: 'capacity',
        label: 'Passenger Capacity',
        type: 'number',
        placeholder: 'e.g., 4',
        required: true
      }
    ]
  },
  'preferred-language': {
    id: 'preferred-language',
    title: 'Preferred Language',
    description: 'Select your preferred languages',
    formFields: [
      {
        name: 'languages',
        label: 'Languages',
        type: 'multiselect',
        placeholder: 'Select languages',
        required: false
      }
    ]
  }
};

const COMMON_LANGUAGES = [
  'English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia'
];

export default function DriverOnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const stepId = params?.stepId as string;

  const [host, setHost] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  const stepConfig = STEP_CONFIGS[stepId];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchDriverProfile(parsedHost._id);
    }
  }, [router]);

  useEffect(() => {
    if (driverProfile && stepConfig) {
      // Pre-fill form data from existing profile
      const initialData: { [key: string]: any } = {};
      
      if (stepConfig.formFields) {
        stepConfig.formFields.forEach(field => {
          if (field.name === 'languages') {
            initialData[field.name] = driverProfile.languages || [];
          } else if (field.name.includes('vehicleDetails')) {
            initialData[field.name] = driverProfile.vehicleDetails?.[field.name.replace('vehicleDetails.', '')] || '';
          } else {
            initialData[field.name] = driverProfile[field.name] || '';
          }
        });
      }
      
      if (stepConfig.id === 'vehicle-details') {
        initialData.make = driverProfile.vehicleDetails?.make || '';
        initialData.model = driverProfile.vehicleDetails?.model || '';
        initialData.year = driverProfile.vehicleDetails?.year || '';
        initialData.capacity = driverProfile.vehicleDetails?.capacity || '';
      }
      
      if (stepConfig.id === 'driving-license') {
        initialData.licenseNumber = driverProfile.licenseNumber || '';
      }
      
      if (stepConfig.id === 'vehicle-registration') {
        initialData.registrationNumber = driverProfile.vehicleDetails?.registrationNumber || '';
      }
      
      setFormData(initialData);
    }
  }, [driverProfile, stepConfig]);

  const fetchDriverProfile = async (providerId: string) => {
    try {
      const response = await api.get(`/drivers/profile/${providerId}`);
      setDriverProfile(response.data.driverProfile);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => {
      const currentLanguages = prev.languages || [];
      const isSelected = currentLanguages.includes(language);
      return {
        ...prev,
        languages: isSelected
          ? currentLanguages.filter((l: string) => l !== language)
          : [...currentLanguages, language]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setUploading(true);

    try {
      const providerId = host._id;

      // Handle file uploads
      if (stepConfig.isProfilePicture) {
        if (!file) {
          setError('Please select a profile picture');
          setUploading(false);
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('profilePicture', file);

        await api.post(`/drivers/profile-picture/${providerId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSuccess(true);
        setTimeout(() => {
          router.push('/driver/onboarding');
        }, 1500);
        return;
      }

      if (stepConfig.documentType && stepConfig.fieldName) {
        if (!file) {
          setError('Please select a document to upload');
          setUploading(false);
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('document', file);
        formDataToSend.append('documentType', stepConfig.documentType);
        formDataToSend.append('documentName', file.name);

        // Add form fields if any
        if (stepConfig.formFields) {
          stepConfig.formFields.forEach(field => {
            if (field.name !== 'languages' && formData[field.name]) {
              formDataToSend.append(field.name, formData[field.name]);
            }
          });
        }

        await api.post(`/drivers/documents/${providerId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Update profile with form data if needed
        const updateData: any = {};
        
        if (stepConfig.id === 'driving-license' && formData.licenseNumber) {
          updateData.licenseNumber = formData.licenseNumber;
        }
        
        if (stepConfig.id === 'vehicle-registration' && formData.registrationNumber) {
          updateData.vehicleDetails = {
            ...driverProfile?.vehicleDetails,
            registrationNumber: formData.registrationNumber
          };
        }

        if (Object.keys(updateData).length > 0) {
          await api.put(`/drivers/profile/${providerId}`, updateData);
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/driver/onboarding');
        }, 1500);
        return;
      }

      // Handle form-only submissions (vehicle details, languages)
      if (stepConfig.id === 'vehicle-details') {
        const updateData = {
          vehicleDetails: {
            make: formData.make,
            model: formData.model,
            year: parseInt(formData.year),
            capacity: parseInt(formData.capacity)
          }
        };

        await api.put(`/drivers/profile/${providerId}`, updateData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/driver/onboarding');
        }, 1500);
        return;
      }

      if (stepConfig.id === 'preferred-language') {
        const updateData = {
          languages: formData.languages || []
        };

        await api.put(`/drivers/profile/${providerId}`, updateData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/driver/onboarding');
        }, 1500);
        return;
      }

    } catch (err: any) {
      console.error('Error submitting:', err);
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!stepConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Step not found</h1>
          <button
            onClick={() => router.push('/driver/onboarding')}
            className="btn-primary mt-4"
          >
            Back to Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/driver/onboarding')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{stepConfig.title}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-soft border border-gray-200">
          <p className="text-gray-600 mb-6">{stepConfig.description}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {stepConfig.isProfilePicture 
                ? 'Profile picture uploaded successfully!'
                : stepConfig.documentType
                ? 'Document uploaded successfully!'
                : 'Information saved successfully!'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            {(stepConfig.documentType || stepConfig.isProfilePicture) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stepConfig.isProfilePicture ? 'Profile Picture' : 'Document'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {filePreview ? (
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setFilePreview(null);
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept={stepConfig.isProfilePicture ? 'image/*' : 'image/*,.pdf'}
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {stepConfig.isProfilePicture 
                            ? 'PNG, JPG, GIF up to 10MB'
                            : 'PNG, JPG, PDF up to 10MB'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {file && !filePreview && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {file.name}
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            {stepConfig.formFields && stepConfig.formFields.map((field) => {
              if (field.type === 'multiselect' && field.name === 'languages') {
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_LANGUAGES.map((lang) => {
                        const isSelected = (formData.languages || []).includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleLanguageToggle(lang)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                    {formData.languages && formData.languages.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {formData.languages.join(', ')}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              );
            })}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/driver/onboarding')}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

