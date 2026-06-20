'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import { EmergencyInfo } from '@/lib/safetyUtils';

export default function EmergencyInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<EmergencyInfo>({
    medicalInfo: '',
    bloodType: undefined,
    allergies: [],
    medications: [],
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      emergencyContact: ''
    }
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    fetchEmergencyInfo();
  }, []);

  const fetchEmergencyInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/safety/emergency-info');
      if (response.data.emergencyInfo) {
        setFormData({
          medicalInfo: response.data.emergencyInfo.medicalInfo || '',
          bloodType: response.data.emergencyInfo.bloodType || undefined,
          allergies: response.data.emergencyInfo.allergies || [],
          medications: response.data.emergencyInfo.medications || [],
          insuranceInfo: response.data.emergencyInfo.insuranceInfo || {
            provider: '',
            policyNumber: '',
            emergencyContact: ''
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load emergency information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.put('/safety/emergency-info', formData);
      setSuccess('Emergency information saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save emergency information');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((_, i) => i !== index) || []
    });
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setFormData({
        ...formData,
        medications: [...(formData.medications || []), newMedication.trim()]
      });
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications?.filter((_, i) => i !== index) || []
    });
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 h-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-below-nav pb-sos-clear">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Emergency Information Card
              </h1>
              <p className="text-lg text-gray-600">Store your medical information for emergency situations</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6">
              <span className="text-lg">✅</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">×</button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="content-card space-y-8">
          {/* Medical Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Medical Information
            </label>
            <textarea
              value={formData.medicalInfo}
              onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="Any important medical conditions, history, or notes..."
            />
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Blood Type
            </label>
            <select
              value={formData.bloodType || ''}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as any || undefined })}
              className="input-field"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Allergies
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                className="input-field flex-1"
                placeholder="Add an allergy"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.allergies && formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Current Medications
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                className="input-field flex-1"
                placeholder="Add a medication"
              />
              <button
                type="button"
                onClick={addMedication}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.medications && formData.medications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.medications.map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Insurance Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={formData.insuranceInfo?.provider || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceInfo: { ...formData.insuranceInfo, provider: e.target.value }
                  })}
                  className="input-field"
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={formData.insuranceInfo?.policyNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceInfo: { ...formData.insuranceInfo, policyNumber: e.target.value }
                  })}
                  className="input-field"
                  placeholder="Policy number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.insuranceInfo?.emergencyContact || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    insuranceInfo: { ...formData.insuranceInfo, emergencyContact: e.target.value }
                  })}
                  className="input-field"
                  placeholder="Insurance emergency contact number"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="btn-secondary flex-1"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="spinner w-4 h-4"></span>
                  Saving...
                </>
              ) : (
                'Save Emergency Information'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

