'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';

interface OnboardingStep {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress';
  required: boolean;
}

export default function DriverOnboardingPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: 'driving-license', title: 'Driving License', status: 'pending', required: true },
    { id: 'profile-picture', title: 'Profile Picture', status: 'pending', required: false },
    { id: 'vehicle-registration', title: 'Vehicle Registration (RC)', status: 'pending', required: true },
    { id: 'vehicle-insurance', title: 'Vehicle Insurance', status: 'pending', required: true },
    { id: 'vehicle-details', title: 'Vehicle Details', status: 'pending', required: true },
    { id: 'preferred-language', title: 'Preferred Language', status: 'pending', required: false }
  ]);

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

  const fetchDriverProfile = async (providerId: string) => {
    try {
      const response = await api.get(`/drivers/profile/${providerId}`);
      setDriverProfile(response.data.driverProfile);
      
      // Update steps based on profile completion
      const updatedSteps = steps.map(step => {
        let status: 'pending' | 'completed' | 'in_progress' = 'pending';
        
        if (response.data.driverProfile) {
          switch (step.id) {
            case 'driving-license':
              status = response.data.driverProfile.licenseNumber ? 'completed' : 'pending';
              break;
            case 'profile-picture':
              status = response.data.driverProfile.providerId?.profilePicture ? 'completed' : 'pending';
              break;
            case 'vehicle-registration':
              status = response.data.driverProfile.vehicleDetails?.registrationNumber ? 'completed' : 'pending';
              break;
            case 'vehicle-insurance':
              status = response.data.driverProfile.documents?.some((d: any) => d.type === 'Insurance') ? 'completed' : 'pending';
              break;
            case 'vehicle-details':
              status = response.data.driverProfile.vehicleDetails?.make ? 'completed' : 'pending';
              break;
            case 'preferred-language':
              status = response.data.driverProfile.languages?.length > 0 ? 'completed' : 'pending';
              break;
          }
        }
        
        return { ...step, status };
      });
      
      setSteps(updatedSteps);
      
      // Set recommended next step
      const nextStep = updatedSteps.find(s => s.status === 'pending' && s.required) || 
                       updatedSteps.find(s => s.status === 'pending');
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
    router.push(`/driver/onboarding/${stepId}`);
  };

  const getCompletionPercentage = () => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/provider/drivers')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Tribelink</h1>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Help
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Context Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Signing up for</p>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {host?.location || 'Kochi'} • Rides 🚗
            </h2>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {host?.name || 'Driver'}!
          </h1>
          <p className="text-gray-600">
            Here's what you need to do to set up your account.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold text-primary-600">{getCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isRecommended = step.status === 'pending' && step.required && 
                                  !steps.slice(0, index).some(s => s.status === 'pending' && s.required);
            
            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all ${
                  step.status === 'completed'
                    ? 'border-green-200 bg-green-50/30'
                    : isRecommended
                    ? 'border-primary-500 bg-primary-50/30 shadow-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : isRecommended
                        ? 'bg-primary-500'
                        : 'bg-gray-200'
                    }`}>
                      {step.status === 'completed' ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        {step.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            Required
                          </span>
                        )}
                      </div>
                      {step.status === 'completed' && (
                        <p className="text-sm text-green-600 font-medium">Completed</p>
                      )}
                      {isRecommended && (
                        <p className="text-sm text-primary-600 font-medium">Recommended next step</p>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        {steps.every(s => s.status === 'completed') && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Set!</h3>
              <p className="text-gray-600 mb-6">Your profile is complete. You can now start accepting trips.</p>
              <button
                onClick={() => router.push('/driver/schedule')}
                className="btn-primary px-8 py-3 text-lg"
              >
                View My Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

