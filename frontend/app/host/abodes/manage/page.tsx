'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AbodeSidebar from '@/components/AbodeSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { getImageUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

interface Abode {
  _id: string;
  abodeDetails: {
    description: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    houseRules: string[];
    propertyType: string;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
  };
  pricing: {
    pricePerNight: number;
    currency: string;
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
}

export default function ManageAbodePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abodes, setAbodes] = useState<Abode[]>([]);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'LOCAL_HOST') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchAbodes();
    }
  }, [router]);

  const fetchAbodes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/abodes/owner/my-abodes');
      setAbodes(response.data.abodes || []);
    } catch (err: any) {
      console.error('Error fetching abodes:', err);
      setError(err.response?.data?.message || 'Failed to load abodes');
      toast.error('Failed to load abodes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this abode? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/abodes/${id}`);
      toast.success('Abode deleted successfully');
      fetchAbodes();
    } catch (err: any) {
      console.error('Error deleting abode:', err);
      toast.error(err.response?.data?.message || 'Failed to delete abode');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <AbodeSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-amber-900">Loading your abodes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <AbodeSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">My Abodes</h1>
            <p className="text-amber-700">Manage your abode listings</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {abodes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-amber-100 text-center"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-amber-900 mb-3">No Abodes Yet</h2>
              <p className="text-amber-700 mb-6">
                Register your first abode to start sharing your home and culture with travelers
              </p>
              <button
                onClick={() => router.push('/adobes/register')}
                className="px-8 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all shadow-lg"
              >
                Register Your Abode
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {abodes.map((abode, index) => (
                <motion.div
                  key={abode._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden hover:shadow-2xl transition-all"
                >
                  <div className="md:flex">
                    {/* Image */}
                    <div className="md:w-1/3 h-64 md:h-auto relative">
                      {abode.images && abode.images.length > 0 ? (
                        <img
                          src={getImageUrl(abode.images.find(img => img.isMain)?.url || abode.images[0].url) || undefined}
                          alt={abode.abodeDetails.description.substring(0, 50)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                          <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      {abode.isVerified && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-amber-900 mb-2">
                            {abode.abodeDetails.propertyType}
                          </h3>
                          <div className="flex items-center gap-4 text-amber-700 text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {abode.location.district}, {abode.location.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {abode.abodeDetails.capacity} guests
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">
                            ₹{abode.pricing.pricePerNight}
                          </div>
                          <div className="text-sm text-amber-600">per night</div>
                        </div>
                      </div>

                      <p className="text-amber-700 mb-4 line-clamp-2">
                        {abode.abodeDetails.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {abode.abodeDetails.amenities.slice(0, 5).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {abode.abodeDetails.amenities.length > 5 && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            +{abode.abodeDetails.amenities.length - 5} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(abode.rating)
                                    ? 'text-amber-400'
                                    : 'text-amber-200'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-amber-700">
                            {abode.rating.toFixed(1)} ({abode.ratingCount} reviews)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/adobes/${abode._id}`)}
                            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/host/abodes/edit/${abode._id}`)}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(abode._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add New Abode Button */}
          {abodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
            >
              <button
                onClick={() => router.push('/adobes/register')}
                className="px-8 py-4 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register Another Abode
              </button>
            </motion.div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

